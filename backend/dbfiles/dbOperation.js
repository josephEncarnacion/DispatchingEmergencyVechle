const config = require('./dbConfig');
const sql = require('mssql');


const insertComplaint = async (name, address, complaintType, complaintText, latitude, longitude, mediaUrl, userId) => {
    try {
        let pool = await sql.connect(config);
        const query = `
            INSERT INTO Complaint_tbl (Name, Address, ComplaintType, ComplaintText, Latitude, Longitude, MediaUrl, user_id)
            VALUES (@name, @address, @complaintType, @complaintText, @latitude, @longitude, @mediaUrl, @userId)
        `;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('address', sql.VarChar, address)
            .input('complaintType', sql.VarChar, complaintType)
            .input('complaintText', sql.VarChar, complaintText)
            .input('latitude', sql.Float, latitude)
            .input('longitude', sql.Float, longitude)
            .input('mediaUrl', sql.VarChar, mediaUrl) // Store the media URL
            .input('userId', sql.Int, userId) // Store the user ID

            .query(query);
        console.log('Complaint inserted successfully.');
    } catch (error) {
        console.error('Error inserting complaint:', error);
        throw error;
    }
};

const insertEmergencyReport = async (name, address, emergencyType, emergencyText, latitude, longitude, mediaUrl, userId) => {
    try {
        let pool = await sql.connect(config);
        const query = `
            INSERT INTO Emergency_tbl (Name, Address, EmergencyType, EmergencyText, Latitude, Longitude, MediaUrl, user_id)
            VALUES (@name, @address, @emergencyType, @emergencyText, @latitude, @longitude, @mediaUrl, @userId)
        `;
        await pool.request()
            .input('name', sql.VarChar, name)
            .input('address', sql.VarChar, address)
            .input('emergencyType', sql.VarChar, emergencyType)
            .input('emergencyText', sql.VarChar, emergencyText)
            .input('latitude', sql.Float, latitude)
            .input('longitude', sql.Float, longitude)
            .input('mediaUrl', sql.VarChar, mediaUrl)
            .input('userId', sql.Int, userId) // Store the user ID
            .query(query);
        console.log('Emergency report inserted successfully.');
    } catch (error) {
        console.error('Error inserting emergency report:', error);
        throw error;
    }
};

  
async function getUserByUsername(username) {
    try {
        let pool = await sql.connect(config);
        const query = 'SELECT id, username, password, role, first_name, last_name, name FROM users WHERE username = @username';
        const result = await pool.request()
            .input('username', sql.VarChar, username)
            .query(query);
        return result.recordset[0]; // Assuming you expect only one user
    } catch (error) {
        console.error('Error retrieving user by username:', error);
        throw error;
    }
}
async function insertUser(user) {
    try {
        let pool = await sql.connect(config);
        const query = 'INSERT INTO users (username, first_name, last_name, password) VALUES (@username, @firstName, @lastName, @password)';
        await pool.request()
            .input('username', sql.VarChar, user.username)
            .input('firstName', sql.VarChar, user.firstName)
            .input('lastName', sql.VarChar, user.lastName)
            .input('password', sql.VarChar, user.password)
            .query(query);
        console.log('User inserted successfully.');
    } catch (error) {
        console.error('Error inserting user:', error);
        throw error;
    }
}

const getPaginatedComplaints = async (page, pageSize) => {
    try {
        let pool = await sql.connect(config);
        const query = `
            SELECT Name, Address, ComplaintType, ComplaintText, Latitude, Longitude, MediaUrl
            FROM Complaint_tbl
            ORDER BY Name
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `;
        const result = await pool.request()
            .input('offset', sql.Int, (page - 1) * pageSize)
            .input('pageSize', sql.Int, pageSize)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error retrieving paginated complaints:', error);
        throw error;
    }
};

const getPaginatedEmergencies = async (page, pageSize) => {
    try {
        let pool = await sql.connect(config);
        const query = `
            SELECT Name, Address, EmergencyType, EmergencyText, Latitude, Longitude, MediaUrl
            FROM Emergency_tbl
            ORDER BY Name
            OFFSET @offset ROWS FETCH NEXT @pageSize ROWS ONLY
        `; // Retrieve MediaUrl along with other fields
        const result = await pool.request()
            .input('offset', sql.Int, (page - 1) * pageSize)
            .input('pageSize', sql.Int, pageSize)
            .query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error retrieving paginated emergencies:', error);
        throw error;
    }
};


// Delete complaint by name
const deleteComplaintByName = async (name) => {
    try {
        let pool = await sql.connect(config);
        const query = 'DELETE FROM Complaint_tbl WHERE Name = @name';
        await pool.request()
            .input('name', sql.VarChar, name)
            .query(query);
        console.log('Complaint deleted successfully.');
    } catch (error) {
        console.error('Error deleting complaint:', error);
        throw error;
    }
};

// Delete emergency by name
const deleteEmergencyByName = async (name) => {
    try {
        let pool = await sql.connect(config);
        const query = 'DELETE FROM Emergency_tbl WHERE Name = @name';
        await pool.request()
            .input('name', sql.VarChar, name)
            .query(query);
        console.log('Emergency deleted successfully.');
    } catch (error) {
        console.error('Error deleting emergency:', error);
        throw error;
    }
};
const confirmComplaintByName = async (name) => {
    try {
        let pool = await sql.connect(config);

        // Select the complaint to be confirmed
        let complaintResult = await pool.request()
            .input('name', sql.VarChar, name)
            .query('SELECT * FROM Complaint_tbl WHERE Name = @name');

        if (complaintResult.recordset.length > 0) {
            const complaint = complaintResult.recordset[0];

            const mediaUrl = complaint.MediaURL || null;
            const userId = complaint.user_id;
            const message = 'Your emergency report has been confirmed';


            // Insert the complaint into ConfirmedComplaint_tbl
            await pool.request()
                .input('name', sql.VarChar, complaint.Name)
                .input('address', sql.VarChar, complaint.Address)
                .input('complaintType', sql.VarChar, complaint.ComplaintType)
                .input('complaintText', sql.Text, complaint.ComplaintText)
                .input('latitude', sql.Float, complaint.Latitude)
                .input('longitude', sql.Float, complaint.Longitude)
                .input('mediaUrl', sql.VarChar, mediaUrl)
                .input('userId', sql.Int, userId)

                .query(`INSERT INTO ConfirmedComplaint_tbl 
                        (Name, Address, ComplaintType, ComplaintText, Latitude, Longitude, MediaURL, user_id) 
                        VALUES (@name, @address, @complaintType, @complaintText, @latitude, @longitude, @mediaUrl, @userId)`);

                        
             // Add notification for the user who submitted the emergency
             await pool.request()
             .input('userId', sql.Int, userId)
             .input('message', sql.VarChar, message)
             .query(`
                 INSERT INTO Notifications (user_id, message) 
                 VALUES (@userId, @message)
             `);

             await pool.request()
             .input('userId', sql.Int, 1005)
             .input('message', sql.VarChar, message)
             .query(`
                 INSERT INTO Notifications (user_id, message) 
                 VALUES (@userId, 'New Comfirmed complaint ready for dispatch')
             `);

            // Delete the complaint from Complaint_tbl
            await pool.request()
                .input('name', sql.VarChar, name)
                .query('DELETE FROM Complaint_tbl WHERE Name = @name');
        }
    } catch (error) {
        console.error('Error confirming complaint:', error);
        throw error;
    }
};

const confirmEmergencyByName = async (name) => {
    try {
        let pool = await sql.connect(config);

        // Select the emergency to be confirmed along with user_id
        let emergencyResult = await pool.request()
            .input('name', sql.VarChar, name)
            .query('SELECT * FROM Emergency_tbl WHERE Name = @name');

        if (emergencyResult.recordset.length > 0) {
            const emergency = emergencyResult.recordset[0];
            const userId = emergency.user_id;
            const message = 'Your emergency report has been confirmed';

            // Insert the emergency into ConfirmedEmergency_tbl
            await pool.request()
                .input('name', sql.VarChar, emergency.Name)
                .input('address', sql.VarChar, emergency.Address)
                .input('emergencyType', sql.VarChar, emergency.EmergencyType)
                .input('emergencyText', sql.Text, emergency.EmergencyText)
                .input('latitude', sql.Float, emergency.Latitude)
                .input('longitude', sql.Float, emergency.Longitude)
                .input('mediaUrl', sql.VarChar, emergency.MediaURL || null)
                .input('userId', sql.Int, userId)
                .query(`
                    INSERT INTO ConfirmedEmergency_tbl 
                    (Name, Address, EmergencyType, EmergencyText, Latitude, Longitude, MediaURL, user_id) 
                    VALUES 
                    (@name, @address, @emergencyType, @emergencyText, @latitude, @longitude, @mediaUrl, @userId)
                `);

            // Add notification for the user who submitted the emergency
            await pool.request()
                .input('userId', sql.Int, userId)
                .input('message', sql.VarChar, message)
                .query(`
                    INSERT INTO Notifications (user_id, message) 
                    VALUES (@userId, @message)
                `);

             await pool.request()
                .input('userId', sql.Int, 1005)
                .input('message', sql.VarChar, message)
                .query(`
                    INSERT INTO Notifications (user_id, message) 
                    VALUES (@userId, 'New confirmed emergency ready for dispatch')
                `);

            // Delete the emergency from Emergency_tbl
            await pool.request()
                .input('name', sql.VarChar, name)
                .query('DELETE FROM Emergency_tbl WHERE Name = @name');
        } else {
            throw new Error(`Emergency with name ${name} not found.`);
        }
    } catch (error) {
        console.error('Error confirming emergency:', error);
        throw error;
    }
};




const getConfirmedComplaints = async () => {
    try {
        let pool = await sql.connect(config);
        const query = 'SELECT Name, Address, ComplaintType, ComplaintText, Latitude, Longitude, MediaUrl FROM ConfirmedComplaint_tbl';
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error retrieving confirmed complaints:', error);
        throw error;
    }
};
const getConfirmedEmergencies = async () => {
    try {
        let pool = await sql.connect(config);
        const query = 'SELECT Name, Address, EmergencyType, EmergencyText, Latitude, Longitude, MediaUrl FROM ConfirmedEmergency_tbl';
        const result = await pool.request().query(query);
        return result.recordset;
    } catch (error) {
        console.error('Error retrieving confirmed emergencies:', error);
        throw error;
    }
};

const getUserNotifications = async (userId) => {
    try {
        let pool = await sql.connect(config);
        const result = await pool.request()
            .input('userId', sql.Int, userId)
            .query(`
                SELECT id, message, is_read, created_at 
                FROM Notifications 
                WHERE user_id = @userId AND is_read = 0 
                ORDER BY created_at DESC
            `);
        return result.recordset;
    } catch (error) {
        console.error('Error fetching notifications:', error);
        throw error;
    }
};

   

module.exports = {
    insertEmergencyReport,
    getUserNotifications,
    getPaginatedEmergencies,
    getPaginatedComplaints,
    insertComplaint,
    getUserByUsername,
    insertUser,
    deleteComplaintByName,
    deleteEmergencyByName,
    confirmComplaintByName,
    confirmEmergencyByName,
    getConfirmedComplaints,
    getConfirmedEmergencies,
};
