const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;
const Doctor = require('./models/doctor.model');
const Appointment = require('./models/appointment.model');
app.use(bodyParser.json());

mongoose.connect('mongodb://user:user@ac-9qzpedu-shard-00-00.s1peixs.mongodb.net:27017,ac-9qzpedu-shard-00-01.s1peixs.mongodb.net:27017,ac-9qzpedu-shard-00-02.s1peixs.mongodb.net:27017/?ssl=true&replicaSet=atlas-dpr11b-shard-0&authSource=admin&retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

app.get('/', async (req, res) => {
    const apiGuide = {
        '/adddoctors (POST)': {
            description: 'Register a new doctor.',
            requestFormat: {
                name: 'Doctor Name',
                specialty: 'Specialty',
                location: 'Location',
                consultationLimit: 10,
                workingDays: [1, 2, 3, 4, 5],
            },
            responseFormat: 'Details of the registered doctor.',
        },
        '/doctors (GET)': {
            description: 'Get a list of all registered doctors.',
        },
        '/doctors/:doctorId (GET)': {
            description: 'Get details of a specific doctor by providing their ID in the URL.',
            requestFormat: {
                doctorId: 'Doctor ID',
            },
            responseFormat: 'Details of the specific doctor.',
        },
        '/appointments (POST)': {
            description: 'Book a new appointment with a doctor.',
            requestFormat: {
                doctorId: 'Doctor ID',
                patientName: 'Patient Name',
                appointmentDate: '2023-09-27T18:00:00.000Z',
            },
            responseFormat: 'Details of the booked appointment.',
        },
    };

    res.json(apiGuide);
});

app.post('/adddoctors', async (req, res) => {
    const { name, specialty, location, consultationLimit, workingDays } = req.body; // Extract data from the request body

    try {
        // Create a new doctor instance
        const doctor = new Doctor({
            name,
            specialty,
            location,
            consultationLimit,
            workingDays,
        });

        // Save the doctor to the database
        await doctor.save();

        res.status(201).json(doctor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while adding the doctor.' });
    }
});

app.get('/doctors', async (req, res) => {
    try {
        const doctors = await Doctor.find();
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching doctors.' });
    }
});

app.get('/doctors/:doctorId', async (req, res) => {
    const doctorId = req.params.doctorId;
    try {
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found.' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching doctor details.' });
    }
});

app.post('/appointments', async (req, res) => {
    const { doctorId, patientName, appointmentDate } = req.body;
    try {
        // Check if the doctor exists
        const doctor = await Doctor.findById(doctorId);
        if (!doctor) {
            return res.status(404).json({ error: 'Doctor not found.' });
        }

        const appointmentDate = new Date(req.body.appointmentDate);
        console.log("Timingssss->>>>>", appointmentDate);
        console.log("Timingssss->>>>>", appointmentDate.getDay());

        // Check if the appointment is within working hours (evening)
        if (appointmentDate.getUTCHours() < 17 || appointmentDate.getUTCHours() >= 21) {
            return res.status(400).json({ error: 'Appointments are only available in the evening.' });
        }

        // Check if the doctor has defined working days
        if (!doctor.workingDays || !Array.isArray(doctor.workingDays)) {
            return res.status(400).json({ error: 'Doctor does not have defined working days.' });
        }

        // Check if the appointment is on a working day (excluding Sunday)
        if (appointmentDate.getDay() === 0 || !doctor.workingDays.includes(appointmentDate.getDay())) {
            return res.status(400).json({ error: 'Appointments are not available on this day.' });
        }

        // Create the appointment
        const appointment = new Appointment({
            doctor: doctorId,
            patientName,
            appointmentDate,
        });

        // Save the appointment
        await appointment.save();

        // Decrease the doctor's consultation limit
        doctor.consultationLimit--;

        // Update the doctor's information
        await doctor.save();

        res.json(appointment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred while booking the appointment.' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});