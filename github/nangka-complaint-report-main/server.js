const express = require('express');
const dbOperation = require('./dbfiles/dbOperation');
const cors = require('cors');
const app = express();
const API_PORT = process.env.PORT || 5000;
const bcrypt = require('bcrypt'); // Import bcrypt


app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Use extended to parse nested objects
app.use(cors());

const responseTeamLocations = {};
const SALT_ROUNDS = 10; // Define the number of salt rounds for bcrypt hashing

// API to update the response team's location
app.post('/api/updateLocation', (req, res) => {
  const { latitude, longitude, teamId } = req.body; // Include teamId to track each response team

  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ success: false, message: 'Invalid latitude or longitude' });
  }

  const timestamp = new Date();

  // Update the location by teamId (only one location per team)
  responseTeamLocations[teamId] = { latitude, longitude, timestamp };

  res.json({ success: true, message: 'Location updated', timestamp });
});

// API to get all response team locations
app.get('/api/responseTeamLocations', (req, res) => {
  const locations = Object.values(responseTeamLocations);
  return res.json({ success: true, locations });
});


const { getConfirmedComplaints, getConfirmedEmergencies } = require('./dbfiles/dbOperation');
const { getPaginatedComplaints, getPaginatedEmergencies } = require('./dbfiles/dbOperation');
app.get('/api/confirmedReports', async (req, res) => {
    try {
        const confirmedComplaints = await getConfirmedComplaints();
        const confirmedEmergencies = await getConfirmedEmergencies();
        res.json({
            complaints: confirmedComplaints,
            emergencies: confirmedEmergencies
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch confirmed reports' });
    }
});



app.get('/api', (req, res) => {
  res.json({ message: 'API endpoint is working' });
});
app.get('/complaints', async (req, res) => {
  const { page = 1, pageSize = 10 } = req.query;
  try {
      const complaints = await getPaginatedComplaints(parseInt(page), parseInt(pageSize));
      res.json(complaints);
  } catch (error) {
      res.status(500).json({ error: 'Failed to fetch complaints' });
  }
});

app.get('/emergencies', async (req, res) => {
    const { page = 1, pageSize = 10 } = req.query;
    try {
        const emergencies = await dbOperation.getPaginatedEmergencies(parseInt(page), parseInt(pageSize));
        res.json(emergencies); // Make sure mediaUrl is included in the response
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch emergencies' });
    }
  });
  

// Route to handle form submission
app.post('/submitComplaint', async (req, res) => {
    const { name, address, complaintType, complaintText,location, mediaUrl, userId } = req.body;
    const { lat, lng } = location; // Extract latitude and longitude from location object
    try {
      await dbOperation.insertComplaint(name, address, complaintType, complaintText , lat, lng, mediaUrl, userId);
      res.status(200).json({ success: true, message: 'Complaint report submitted successfully.' });
  } catch (error) {
      console.error('Error submitting Complaint report:', error);
      res.status(500).json({ success: false, message: 'Failed to submit Complaint report.' });
  }
});

app.post('/submitEmergencyReport', async (req, res) => {
  const { name, address, emergencyType, emergencyText, location, mediaUrl, userId } = req.body; // Add userId
  const { lat, lng } = location;

  try {
      await dbOperation.insertEmergencyReport(name, address, emergencyType, emergencyText, lat, lng, mediaUrl, userId); // Pass userId
      res.status(200).json({ success: true, message: 'Emergency report submitted successfully.' });
  } catch (error) {
      console.error('Error submitting emergency report:', error);
      res.status(500).json({ success: false, message: 'Failed to submit emergency report.' });
  }
});


app.get('/login', (req, res) => {
    res.sendFile(__dirname + '/login.js');
  });
  
  app.get('/register', (req, res) => {
    res.sendFile(__dirname + '/register.js');
  });
  
  app.post('/login', async (req, res) => {
    const { username, password } = req.body;
  
    try {
      const user = await dbOperation.getUserByUsername(username);
  
      if (user && await bcrypt.compare(password, user.password)) { // Compare hashed password
        console.log(`User logged in: ${user.id} ${user.first_name} ${user.last_name}`);
  
        res.status(200).json({
          success: true,
          id: user.id,
          role: user.role,
          first_name: user.first_name,
          last_name: user.last_name,
          message: 'Login successful.'
        });
      } else {
        res.status(401).json({ success: false, message: 'Invalid credentials.' });
      }
    } catch (error) {
      console.error('Error logging in:', error);
      res.status(500).json({ success: false, message: 'Error logging in.' });
    }
  });


app.post('/register', async (req, res) => {
  const { username, firstName, lastName, password } = req.body;
  try {
      const existingUser = await dbOperation.getUserByUsername(username);
      if (existingUser) {
          return res.status(400).json({ success: false, message: 'Username already exists.' });
      }
      // Hash the password before storing
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        await dbOperation.insertUser({ username, firstName, lastName, password: hashedPassword });
        res.status(200).json({ success: true, message: 'Registration successful.' });
  } catch (error) {
      console.error('Error registering:', error);
      res.status(500).json({ success: false, message: 'Error registering.' });
  }
});


  // Delete complaint by name
app.delete('/complaints/:name', async (req, res) => {
  const { name } = req.params;
  try {
      await dbOperation.deleteComplaintByName(name);
      res.status(200).json({ success: true, message: 'Complaint deleted successfully.' });
  } catch (error) {
      console.error('Error deleting complaint:', error);
      res.status(500).json({ success: false, message: 'Failed to delete complaint.' });
  }
});

// Delete emergency by name
app.delete('/emergencies/:name', async (req, res) => {
  const { name } = req.params;
  try {
      await dbOperation.deleteEmergencyByName(name);
      res.status(200).json({ success: true, message: 'Emergency deleted successfully.' });
  } catch (error) {
      console.error('Error deleting emergency:', error);
      res.status(500).json({ success: false, message: 'Failed to delete emergency.' });
  }
});

app.post('/complaints/confirm/:name', async (req, res) => {
  const { name } = req.params;
  try {
      await dbOperation.confirmComplaintByName(name);
      res.status(200).json({ success: true, message: 'Complaint confirmed successfully.' });
  } catch (error) {
      console.error('Error confirming complaint:', error);
      res.status(500).json({ success: false, message: 'Failed to confirm complaint.' });
  }
});

app.post('/emergencies/confirm/:name', async (req, res) => {
  const { name } = req.params; 
  try {
      await dbOperation.confirmEmergencyByName(name);   
      res.status(200).json({ success: true, message: 'Emergency confirmed successfully.' });
  } catch (error) {
      console.error('Error confirming emergency:', error);
      res.status(500).json({ success: false, message: 'Failed to confirm emergency.' });
  }
});

app.get('/api/notifications/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
      const notifications = await dbOperation.getUserNotifications(userId);
      res.status(200).json({ notifications });
  } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ success: false, message: 'Error fetching notifications.' });
  }
});

  
app.listen(API_PORT, () => console.log(`Server is running on port ${API_PORT}`));
