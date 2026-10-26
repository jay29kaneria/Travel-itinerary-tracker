const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// ─── MongoDB Connection ──────────────────────────────────────────────────────
mongoose.connect('mongodb://localhost:27017/travel_tracker_db', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ Connected to MongoDB - Travel Tracker DB'))
.catch(err => console.log('❌ MongoDB Connection Error:', err));

// ─── Schemas & Models ────────────────────────────────────────────────────────

// Admin Schema
const adminSchema = new mongoose.Schema({
    name:      { type: String, required: true },
    email:     { type: String, required: true, unique: true },
    password:  { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Admin = mongoose.model('Admin', adminSchema);

// Itinerary Schema
const itinerarySchema = new mongoose.Schema({
    tripId:       { type: String, required: true },
    destination:  { type: String, required: true },
    travelerName: { type: String, required: true },
    travelDate:   { type: Date, required: true },
    returnDate:   { type: Date, required: true },
    status:       { type: String, enum: ['Planned', 'Ongoing', 'Completed', 'Cancelled'], default: 'Planned' },
    notes:        { type: String, default: '' },
    latitude:     { type: Number, default: null },
    longitude:    { type: Number, default: null },
    createdAt:    { type: Date, default: Date.now }
});

const Itinerary = mongoose.model('Itinerary', itinerarySchema);

// Expense Schema
const expenseSchema = new mongoose.Schema({
    itineraryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Itinerary', required: true },
    category:    { type: String, required: true },
    description: { type: String },
    amount:      { type: Number, required: true },
    expenseDate: { type: Date, required: true },
    createdAt:   { type: Date, default: Date.now }
});

const Expense = mongoose.model('Expense', expenseSchema);

// ─── ADMIN REGISTER ──────────────────────────────────────────────────────────
app.post('/api/admin/register', async (req, res) => {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
        return res.status(400).json({ message: 'All fields are required' });

    try {
        const existing = await Admin.findOne({ email });
        if (existing)
            return res.status(409).json({ message: 'Admin email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const admin = new Admin({ name, email, password: hashedPassword });
        await admin.save();

        res.status(201).json({ message: 'Admin registered successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ─── ADMIN LOGIN ─────────────────────────────────────────────────────────────
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password)
        return res.status(400).json({ message: 'Email and password are required' });

    try {
        const admin = await Admin.findOne({ email });
        if (!admin)
            return res.status(401).json({ message: 'Invalid email or password' });

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch)
            return res.status(401).json({ message: 'Invalid email or password' });

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: 'admin' },
            process.env.JWT_SECRET || 'travel-secret-key',
            { expiresIn: '1h' }
        );

        res.status(200).json({
            message: 'Login successful',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email }
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
});

// ─── ADD ITINERARY ────────────────────────────────────────────────────────────
app.post('/api/itineraries', async (req, res) => {
    const { tripId, destination, travelerName, travelDate, returnDate, status, notes, latitude, longitude } = req.body;

    try {
        const itinerary = new Itinerary({
            tripId, destination, travelerName,
            travelDate, returnDate,
            status: status || 'Planned',
            notes: notes || '',
            latitude:  latitude  !== undefined ? parseFloat(latitude)  : null,
            longitude: longitude !== undefined ? parseFloat(longitude) : null
        });
        await itinerary.save();
        res.status(201).json({ message: 'Itinerary added successfully', itinerary });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add itinerary', error: err.message });
    }
});

// ─── GET ALL ITINERARIES ──────────────────────────────────────────────────────
app.get('/api/itineraries', async (req, res) => {
    try {
        const itineraries = await Itinerary.find().sort({ travelDate: 1 });

        // Aggregate total expenses per itinerary
        const result = await Promise.all(
            itineraries.map(async (item) => {
                const expenses = await Expense.find({ itineraryId: item._id });
                const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);
                return { ...item.toObject(), totalExpense };
            })
        );

        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch itineraries', error: err.message });
    }
});

// ─── GET SINGLE ITINERARY ─────────────────────────────────────────────────────
app.get('/api/itineraries/:id', async (req, res) => {
    try {
        const itinerary = await Itinerary.findById(req.params.id);
        if (!itinerary)
            return res.status(404).json({ message: 'Itinerary not found' });
        res.json(itinerary);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch itinerary', error: err.message });
    }
});

// ─── UPDATE ITINERARY ─────────────────────────────────────────────────────────
app.put('/api/itineraries/:id', async (req, res) => {
    const { destination, travelerName, travelDate, returnDate, status, notes, latitude, longitude } = req.body;

    try {
        const updated = await Itinerary.findByIdAndUpdate(
            req.params.id,
            { destination, travelerName, travelDate, returnDate, status, notes,
              latitude:  latitude  !== undefined ? parseFloat(latitude)  : null,
              longitude: longitude !== undefined ? parseFloat(longitude) : null },
            { new: true, runValidators: true }
        );

        if (!updated)
            return res.status(404).json({ message: 'Itinerary not found' });

        res.json({ message: 'Itinerary updated successfully', itinerary: updated });
    } catch (err) {
        res.status(500).json({ message: 'Failed to update itinerary', error: err.message });
    }
});

// ─── DELETE ITINERARY ─────────────────────────────────────────────────────────
app.delete('/api/itineraries/:id', async (req, res) => {
    try {
        const itinerary = await Itinerary.findByIdAndDelete(req.params.id);
        if (!itinerary)
            return res.status(404).json({ message: 'Itinerary not found' });

        // Delete related expenses
        await Expense.deleteMany({ itineraryId: req.params.id });

        res.json({ message: 'Itinerary and its expenses deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete itinerary', error: err.message });
    }
});

// ─── ADD EXPENSE ──────────────────────────────────────────────────────────────
app.post('/api/expenses', async (req, res) => {
    const { itineraryId, category, description, amount, expenseDate } = req.body;

    try {
        const expense = new Expense({ itineraryId, category, description, amount, expenseDate });
        await expense.save();
        res.status(201).json({ message: 'Expense added successfully', expense });
    } catch (err) {
        res.status(500).json({ message: 'Failed to add expense', error: err.message });
    }
});

// ─── GET EXPENSES FOR AN ITINERARY ───────────────────────────────────────────
app.get('/api/expenses/:itineraryId', async (req, res) => {
    try {
        const expenses = await Expense.find({ itineraryId: req.params.itineraryId }).sort({ expenseDate: 1 });
        res.json(expenses);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch expenses', error: err.message });
    }
});

// ─── DELETE EXPENSE ───────────────────────────────────────────────────────────
app.delete('/api/expenses/:id', async (req, res) => {
    try {
        const expense = await Expense.findByIdAndDelete(req.params.id);
        if (!expense)
            return res.status(404).json({ message: 'Expense not found' });
        res.json({ message: 'Expense deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to delete expense', error: err.message });
    }
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(5000, () => {
    console.log('🚀 Server running on http://localhost:5000');
});
