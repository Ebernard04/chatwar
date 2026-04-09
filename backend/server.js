require('dotenv').config({ path: '../.env' });
const express = require('express');
const session = require('express-session');
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

const authRoutes = require('./routes/auth');
const widgetRoutes = require('./routes/widget');

app.use('/auth', authRoutes);
app.use('/widget', widgetRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Chat War backend running on port ${PORT}`);
});
