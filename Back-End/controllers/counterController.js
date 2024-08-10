const Counter = require('../models/countermodel');

exports.getCounter = (req, res) => {
    res.json({ value: Counter.value });
};

exports.saveCounter = (req, res) => {
    Counter.value = req.body.value;
    res.json({ message: 'Counter value saved successfully' });
};
