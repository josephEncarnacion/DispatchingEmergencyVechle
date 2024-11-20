    // src/MapComponent.js
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const MapComponent = () => {delete L.Icon.Default.prototype._getIconUrl;

    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
    
    const [complaints, setComplaints] = useState([]);
    const [emergencies, setEmergencies] = useState([]);

    useEffect(() => {
        fetch('/complaints')
            .then(response => response.json())
            .then(data => setComplaints(data));

        fetch('/emergencies')
            .then(response => response.json())
            .then(data => setEmergencies(data));
    }, []);

    return (
        <MapContainer center={[14.6507, 121.1029]} zoom={15} style={{ height: '100vh', width: '100%' }}>
           <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
            />
            {complaints.map((complaint, idx) => (
                <Marker key={`complaint-${idx}`} position={[complaint.Latitude, complaint.Longitude]}>
                    <Popup>
                    <strong>Name:</strong>    <strong>{complaint.Name}</strong><br />
                    <strong>Address:</strong>    {complaint.Address}<br />
                    <strong>Type:</strong>    {complaint.ComplaintType}<br />
                    <strong>Description:</strong>    {complaint.ComplaintText}
                    </Popup>
                </Marker>
            ))}
            {emergencies.map((emergency, idx) => (
                <Marker key={`emergency-${idx}`} position={[emergency.Latitude, emergency.Longitude]}>
                    <Popup>
                    <strong>Name:</strong> <strong>{emergency.Name}</strong><br />
                    <strong>Address:</strong>    {emergency.Address}<br />
                    <strong>Type:</strong>    {emergency.EmergencyType}<br />
                    <strong>Description:</strong>    {emergency.EmergencyText}
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapComponent;
