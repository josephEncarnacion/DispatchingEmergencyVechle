import React, { useEffect, useState, useRef } from 'react';
import {
  Button,TablePagination, TableContainer, TableHead, AppBar, Toolbar, Typography, InputLabel ,FormControl, Box, TextField, Drawer, List, ListItem, ListItemIcon, ListItemText, CssBaseline, Divider, Container, Table, TableBody, TableCell,MenuItem, TableRow,Select, Paper, Grid,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import MapIcon from '@mui/icons-material/Map';
import ReportIcon from '@mui/icons-material/Report';
import CustomPaginationActions from '../components/CustomPaginationActions';
import MapComponent from '../components/MapComponent';
import { useAuth } from '../contexts/AuthContext'; 
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { BarChart as BarChartIcon } from '@mui/icons-material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import GroupIcon from '@mui/icons-material/Group';
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import * as XLSX from 'xlsx'; // Import xlsx library for Excel file creation
import { Line , Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement,
} from 'chart.js';
import { 
  Analytics as AnalyticsIcon,
  Assignment as AssignmentIcon,
  LocalShipping as LocalShippingIcon,
  Security as SecurityIcon,
  Settings as SettingsIcon,
  Person as PersonIcon
} from '@mui/icons-material';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    BarElement
);


const defaultMarkerIcon = L.icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  shadowSize: [41, 41],
});


const vehicleIcon = L.divIcon({
  className: 'custom-div-icon',
  html: `<div style="border-radius: 50%; width: 32px; height: 32px; display: flex; justify-content: center; align-items: center;">
           <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
             <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V5H6.5C5.84 5 5.28 5.42 5.08 6.01L3 12V21C3 21.55 3.45 22 4 22H5C5.55 22 6 21.55 6 21V20H18V21C18 21.55 18.45 22 19 22H20C20.55 22 21 21.55 21 21V12L18.92 6.01ZM10 4H14V5H10V4ZM6.85 7H17.14L18.22 10H5.78L6.85 7ZM19 18C18.45 18 18 17.55 18 17C18 16.45 18.45 16 19 16C19.55 16 20 16.45 20 17C20 17.55 19.55 18 19 18ZM5 18C4.45 18 4 17.55 4 17C4 16.45 4.45 16 5 16C5.55 16 6 16.45 6 17C6 17.55 5.55 18 5 18ZM5 14V12H19V14H5Z" fill="black"/>
           </svg>
         </div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 16]
});


const POLLING_INTERVAL = 10000; // 10 seconds
const drawerWidth = 240;

const AdminPage = () => {
  const { logout } = useAuth(); // Access logout function from AuthContext
  const [selectedSection, setSelectedSection] = useState('dashboard');
  const [complaints, setComplaints] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [complaintPage, setComplaintPage] = useState(0);
  const [complaintRowsPerPage, setComplaintRowsPerPage] = useState(10);
  const [emergencyPage, setEmergencyPage] = useState(0);
  const [emergencyRowsPerPage, setEmergencyRowsPerPage] = useState(10);
  const [responseTeamLocations, setResponseTeamLocations] = useState([]);
  const [confirmedReports, setConfirmedReports] = useState([]); // New state for confirmed reports
  const [activeResponseTeams, setActiveResponseTeams] = useState(0);  // New state for active teams count
  const [newComplaintsCount, setNewComplaintsCount] = useState(0);
  const [newEmergenciesCount, setNewEmergenciesCount] = useState(0);
  const [resolvedReports, setResolvedReports] = useState([]); // New state for resolved reports

  const [resolvedRowsPerPage, setResolvedRowsPerPage] = useState(10);
  const [resolvedPage, setResolvedPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); // Options: 'all', 'day', 'month', 'year'
  const [filteredReports, setFilteredReports] = useState([]);
  const [emergencyCodes, setEmergencyCodes] = useState({});

  const prevComplaints = useRef([]);
  const prevEmergencies = useRef([]);


  const [dailyResolvedData, setDailyResolvedData] = useState([]);
  const [monthlyResolvedData, setMonthlyResolvedData] = useState([]);
  const [yearlyResolvedData, setYearlyResolvedData] = useState([]); // Yearly data
  const [yearLabels, setYearLabels] = useState([]); // Year labels
  const [resolvedByStaff, setResolvedByStaff] = useState({});

  const API_URL = 'http://localhost:5000';

  const getWeekNumber = (date) => {
    const oneJan = new Date(date.getFullYear(), 0, 1);
    const numberOfDays = Math.floor((date - oneJan) / (24 * 60 * 60 * 1000));
    return Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7);
  };


  const fetchAnalyticsData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/resolvedReports`);
      const reports = response.data.resolvedReports || [];

      const dailyCounts = new Array(7).fill(0); // Weekly
      const monthlyCounts = new Array(12).fill(0); // Monthly
      const yearlyCounts = {}; // Yearly
      const staffCounts = {};

      // Initialize year range (2024-2030)
      for (let year = 2024; year <= 2030; year++) {
        yearlyCounts[year] = 0;
      }

      const currentWeek = getWeekNumber(new Date());

      reports.forEach((report) => {
        const resolvedAt = new Date(report.ResolvedAt);
        const day = resolvedAt.getDay(); // 0 (Sunday) to 6 (Saturday)
        const month = resolvedAt.getMonth(); // 0 (Jan) to 11 (Dec)
        const year = resolvedAt.getFullYear();
        const week = getWeekNumber(resolvedAt);

        // Only include data for this week
        if (week === currentWeek) {
          dailyCounts[day]++;
        }

        monthlyCounts[month]++;
        if (yearlyCounts[year] !== undefined) {
          yearlyCounts[year]++;
        }

        // Staff contribution
        staffCounts[report.ResolvedBy] = (staffCounts[report.ResolvedBy] || 0) + 1;
      });

      setDailyResolvedData(dailyCounts);
      setMonthlyResolvedData(monthlyCounts);
      setYearlyResolvedData(Object.values(yearlyCounts)); // Save yearly counts as array
      setYearLabels(Object.keys(yearlyCounts)); // Year range labels
      setResolvedByStaff(staffCounts);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    }
  };

  useEffect(() => {
    if (selectedSection === 'resolvedReportsAnalytics') {
      fetchAnalyticsData();
    }
  }, [selectedSection]);

  // Handle search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    applyFilters(event.target.value, filterType);
  };

  // Handle filter dropdown change
  const handleFilterChange = (event) => {
    setFilterType(event.target.value);
    applyFilters(searchQuery, event.target.value);
  };

  // Apply search and filters
  const applyFilters = (query, filter) => {
    let filtered = resolvedReports;

    if (query) {
        filtered = filtered.filter((report) =>
            report.Name.toLowerCase().includes(query.toLowerCase())
        );
    }

    const now = new Date();
    filtered = filtered.filter((report) => {
        const resolvedDate = new Date(report.ResolvedAt);

        switch (filter) {
            case 'day':
                return (
                    resolvedDate.getDate() === now.getDate() &&
                    resolvedDate.getMonth() === now.getMonth() &&
                    resolvedDate.getFullYear() === now.getFullYear()
                );
            case 'month':
                return (
                    resolvedDate.getMonth() === now.getMonth() &&
                    resolvedDate.getFullYear() === now.getFullYear()
                );
            case 'year':
                return resolvedDate.getFullYear() === now.getFullYear();
            default:
                return true;
        }
    });

    setFilteredReports(filtered);
  };

  // Use effect to initialize filtered reports
  useEffect(() => {
    setFilteredReports(resolvedReports);
  }, [resolvedReports]);
  
  const fetchResolvedReports = async () => {
    try {
        const response = await axios.get(`${API_URL}/api/resolvedReports`);
        setResolvedReports(response.data.resolvedReports || []);
    } catch (error) {
        console.error('Error fetching resolved reports:', error);
    }
  };

  const downloadExcel = () => {
    // Prepare data for Excel
    const generatedDate = new Date().toLocaleString(); // Get current date and time
    const generatedBy = "Admin"; // Fixed value
    
    // Add an extra row for 'Date Generated' and 'Generated By'
    const headerRow = [
        { A: `Date Generated: ${generatedDate}` }, 
        { A: `Generated By: ${generatedBy}` }
    ];

    // Prepare report data
    const reportData = resolvedReports.map(report => ({
        Name: report.Name,
        Address: report.Address,
        Type: report.Type,
        Description: report.Text,
        'Dispatch At': new Date(report.ConfirmedAt).toLocaleString(),
        'Resolved At': new Date(report.ResolvedAt).toLocaleString(),
        'Resolved By': report.ResolvedBy,
    }));

    // Convert JSON data to worksheet
    const worksheet = XLSX.utils.json_to_sheet([]);
    XLSX.utils.sheet_add_json(worksheet, headerRow, { skipHeader: true, origin: -1 }); // Add extra rows
    XLSX.utils.sheet_add_json(worksheet, reportData, { origin: -1 }); // Add report data starting after extra rows

    // Create workbook and append sheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resolved Reports");

    // Trigger file download
    XLSX.writeFile(workbook, "ResolvedReports.xlsx");
};

  const fetchData = async () => {
    try {
      const [complaintsResponse, emergenciesResponse] = await Promise.all([
        axios.get(`${API_URL}/complaints`),
        axios.get(`${API_URL}/emergencies`),
      ]);

      const currentComplaints = complaintsResponse.data;
      const currentEmergencies = emergenciesResponse.data;

  const newComplaints = currentComplaints.filter(
        (complaint) => !prevComplaints.current.some((prev) => prev.id === complaint.id)
      );

      // Identify new emergencies
      const newEmergencies = currentEmergencies.filter(
        (emergency) => !prevEmergencies.current.some((prev) => prev.id === emergency.id)
      );

      // Update new counts
      setNewComplaintsCount(newComplaints.length);
      setNewEmergenciesCount(newEmergencies.length);
      prevComplaints.current = currentComplaints;
      prevEmergencies.current = currentEmergencies;
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };


  const fetchResponseTeamLocations = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/responseTeamLocations`);
      if (response.data.success) {
        console.log("Fetched locations:", response.data.locations);
        setResponseTeamLocations(response.data.locations);
  
        // Count unique active teams based on teamId
        const uniqueTeams = new Set(response.data.locations.map(location => location.teamId));
        setActiveResponseTeams(uniqueTeams.size);
      } else {
        console.error('Failed to fetch locations');
      }
    } catch (error) {
      console.error('Error fetching response team locations:', error);
    }
  };
  
  const fetchConfirmedReports = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/confirmedReports`);
      setComplaints(response.data.complaints || []);
      setEmergencies(response.data.emergencies || []);
      setConfirmedReports([...response.data.complaints, ...response.data.emergencies]);
    } catch (error) {
      console.error('Error fetching confirmed reports:', error);
    }
  };
  
  useEffect(() => {
    fetchResolvedReports();
    fetchData();
    fetchResponseTeamLocations();
    fetchConfirmedReports();
    // Polling every 10 seconds
    const intervalId = setInterval(() => {
      fetchResponseTeamLocations();
      }, POLLING_INTERVAL)

    return () => clearInterval(intervalId);
  }, []);
  



  useEffect(() => {
    if (selectedSection === `complaints`) {
      fetchComplaints(complaintPage, complaintRowsPerPage);
    }
  }, [complaintPage, complaintRowsPerPage, selectedSection]);

  useEffect(() => {
    if (selectedSection === `emergencies`) {
      fetchEmergencies(emergencyPage, emergencyRowsPerPage);
    }
  }, [emergencyPage, emergencyRowsPerPage, selectedSection]);

  const fetchComplaints = async (page, pageSize) => {
    const response = await fetch(`${API_URL}/complaints?page=${page + 1}&pageSize=${pageSize}`);
    const data = await response.json();
    setComplaints(data);
  };

  const fetchEmergencies = async (page, pageSize) => {
    const response = await fetch(`${API_URL}/emergencies?page=${page + 1}&pageSize=${pageSize}`);
    const data = await response.json();
    setEmergencies(data);
  };

  const handleDeleteComplaint = async (name) => {
    if (window.confirm('Are you sure you want to delete this complaint?')) {
      const response = await fetch(`${API_URL}/complaints/${name}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        fetchComplaints(complaintPage, complaintRowsPerPage);
        
      } else {
        alert('Failed to delete complaint');
      }
    }
  };

  const handleConfirmComplaint = async (name) => {
    const emergencyCode = emergencyCodes[name];
    if (!emergencyCode) {
        alert("Please select an emergency code before confirming.");
        return;
    }

    if (window.confirm('Are you sure you want to confirm this complaint?')) {
        const response = await fetch(`${API_URL}/complaints/confirm/${name}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emergencyCode }),
        });
        const result = await response.json();
        if (result.success) {
            fetchComplaints(complaintPage,complaintRowsPerPage);
        } else {
            alert('Failed to confirm complaint');
        }
    }
};

  const handleDeleteEmergency = async (name) => {
    if (window.confirm('Are you sure you want to delete this emergency?')) {
      const response = await fetch(`${API_URL}/emergencies/${name}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        fetchEmergencies(emergencyPage, emergencyRowsPerPage);
       
      } else {
        alert('Failed to delete emergency');
      }
    }
  };

  const handleConfirmEmergency = async (name) => {
    const emergencyCode = emergencyCodes[name];
    if (!emergencyCode) {
      alert("Please select an emergency code before confirming.");
      return;
  }

    if (window.confirm('Are you sure you want to confirm this emergency?')) {
      const response = await fetch(`${API_URL}/emergencies/confirm/${name}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emergencyCode }),
       });
      const result = await response.json();
      if (result.success) {
        fetchEmergencies(emergencyPage, emergencyRowsPerPage);
       
      } else {
        alert('Failed to confirm emergency');
      }
    }
  };

  const handleComplaintPageChange = (event, newPage) => {
    setComplaintPage(newPage);
  };

  const handleComplaintRowsPerPageChange = (event) => {
    setComplaintRowsPerPage(parseInt(event.target.value, 10));
    setComplaintPage(0);
  };

  const handleEmergencyPageChange = (event, newPage) => {
    setEmergencyPage(newPage);
  };

  const handleEmergencyRowsPerPageChange = (event) => {
    setEmergencyRowsPerPage(parseInt(event.target.value, 10));
    setEmergencyPage(0);
  };

  const handleSectionChange = (section) => {
    setSelectedSection(section);
  };

  const setEmergencyCode = (name, code) => {
    setEmergencyCodes((prev) => ({ ...prev, [name]: code }));
};



  const renderSection = () => {
    switch (selectedSection) {
      case 'dashboard':
        return (
            <DashboardMetrics
              newComplaintsCount={newComplaintsCount}
              newEmergenciesCount={newEmergenciesCount}
              confirmedComplaints={confirmedReports.filter(report => report.ComplaintType).length}
              confirmedEmergencies={confirmedReports.filter(report => report.EmergencyType).length}
              activeResponseTeams={activeResponseTeams}
              resolvedReportsCount={resolvedReports.length} // Pass resolved reports count here
              onClickResolvedReports={() => handleSectionChange('resolvedReports')} // Pass navigation handler
              onClickNewComplaints={() => handleSectionChange('complaints')}
              onClickNewEmergencies={() => handleSectionChange('emergencies')}
              onClickOngoingReports={() => handleSectionChange('monitoring')}
              />
        );
        case 'resolvedReportsAnalytics': // New analytics case
        return (
          <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ 
                fontWeight: 700, 
                color: '#1976d2', 
                mb: 1,
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                📊 Reports Analytics Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: '#666', fontSize: '1.1rem' }}>
                Comprehensive insights into emergency response performance and resolution metrics
              </Typography>
            </Box>

            <Grid container spacing={4}>   
              {/* Weekly Graph */}
              <Grid item xs={12} lg={6}>
                <Paper elevation={4} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📅 Daily Resolved Reports (This Week)
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Line
                        data={{
                          labels: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
                          datasets: [
                            {
                              label: 'Daily Resolved Reports',
                              data: dailyResolvedData,
                              borderColor: 'rgba(255, 255, 255, 1)',
                              backgroundColor: 'rgba(255, 255, 255, 0.2)',
                              fill: true,
                              tension: 0.4,
                              borderWidth: 3,
                              pointBackgroundColor: 'rgba(255, 255, 255, 1)',
                              pointBorderColor: '#667eea',
                              pointBorderWidth: 2,
                              pointRadius: 6,
                              pointHoverRadius: 8,
                            },
                          ],
                        }}
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: 'white',
                                font: { size: 12, weight: 'bold' }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' }
                            },
                            y: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: -50,
                    right: -50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                  }} />
                </Paper>
              </Grid>
    
              {/* Monthly Graph */}
              <Grid item xs={12} lg={6}>
                <Paper elevation={4} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      📈 Monthly Resolved Reports
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: [
                            'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                            'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
                          ],
                          datasets: [
                            {
                              label: 'Monthly Resolved Reports',
                              data: monthlyResolvedData,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderColor: 'rgba(255, 255, 255, 1)',
                              borderWidth: 2,
                              borderRadius: 8,
                              borderSkipped: false,
                            },
                          ],
                        }}
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: 'white',
                                font: { size: 12, weight: 'bold' }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' }
                            },
                            y: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    bottom: -30,
                    left: -30,
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                  }} />
                </Paper>
              </Grid>

              {/* Yearly Graph */}
              <Grid item xs={12}>
                <Paper elevation={4} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                  color: 'white',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      🗓️ Resolved Reports Per Year
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: yearLabels,
                          datasets: [
                            {
                              label: 'Resolved Reports Per Year',
                              data: yearlyResolvedData,
                              backgroundColor: 'rgba(255, 255, 255, 0.8)',
                              borderColor: 'rgba(255, 255, 255, 1)',
                              borderWidth: 2,
                              borderRadius: 8,
                              borderSkipped: false,
                            },
                          ],
                        }}
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: 'white',
                                font: { size: 12, weight: 'bold' }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' }
                            },
                            y: {
                              ticks: { color: 'white', font: { weight: 'bold' } },
                              grid: { color: 'rgba(255,255,255,0.2)' },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    top: -40,
                    right: -40,
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.1)',
                    zIndex: 1
                  }} />
                </Paper>
              </Grid>

              {/* Staff Performance */}
              <Grid item xs={12}>
                <Paper elevation={4} sx={{ 
                  p: 3, 
                  borderRadius: 3,
                  background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <Box sx={{ position: 'relative', zIndex: 2 }}>
                    <Typography variant="h6" sx={{ 
                      mb: 2, 
                      fontWeight: 600,
                      color: '#2c3e50',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}>
                      👥 Response Team Performance
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <Bar
                        data={{
                          labels: Object.keys(resolvedByStaff),
                          datasets: [
                            {
                              label: 'Resolved Reports by Staff',
                              data: Object.values(resolvedByStaff),
                              backgroundColor: [
                                'rgba(255, 99, 132, 0.8)',
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(255, 206, 86, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(199, 199, 199, 0.8)',
                                'rgba(83, 102, 255, 0.8)',
                              ],
                              borderColor: [
                                'rgba(255, 99, 132, 1)',
                                'rgba(54, 162, 235, 1)',
                                'rgba(255, 206, 86, 1)',
                                'rgba(75, 192, 192, 1)',
                                'rgba(153, 102, 255, 1)',
                                'rgba(255, 159, 64, 1)',
                                'rgba(199, 199, 199, 1)',
                                'rgba(83, 102, 255, 1)',
                              ],
                              borderWidth: 2,
                              borderRadius: 8,
                              borderSkipped: false,
                            },
                          ],
                        }}
                        options={{ 
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              labels: {
                                color: '#2c3e50',
                                font: { size: 12, weight: 'bold' }
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: { color: '#2c3e50', font: { weight: 'bold' } },
                              grid: { color: 'rgba(44,62,80,0.2)' }
                            },
                            y: {
                              ticks: { color: '#2c3e50', font: { weight: 'bold' } },
                              grid: { color: 'rgba(44,62,80,0.2)' },
                              beginAtZero: true
                            }
                          }
                        }}
                      />
                    </Box>
                  </Box>
                  <Box sx={{
                    position: 'absolute',
                    bottom: -50,
                    left: -50,
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background: 'rgba(44,62,80,0.1)',
                    zIndex: 1
                  }} />
                </Paper>
              </Grid>

              {/* Summary Cards */}
              <Grid item xs={12}>
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={3} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {dailyResolvedData.reduce((a, b) => a + b, 0)}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        This Week's Total
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                      }} />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={3} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {monthlyResolvedData.reduce((a, b) => a + b, 0)}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        This Month's Total
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                      }} />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={3} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                      color: 'white',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {yearlyResolvedData.reduce((a, b) => a + b, 0)}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.9 }}>
                        This Year's Total
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)'
                      }} />
                    </Paper>
                  </Grid>
                  
                  <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={3} sx={{ 
                      p: 3, 
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                      color: '#2c3e50',
                      textAlign: 'center',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {Object.keys(resolvedByStaff).length}
                      </Typography>
                      <Typography variant="body1" sx={{ opacity: 0.8 }}>
                        Active Teams
                      </Typography>
                      <Box sx={{
                        position: 'absolute',
                        top: -20,
                        right: -20,
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        background: 'rgba(44,62,80,0.1)'
                      }} />
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Container>
        );
        case 'map':
        return <MapComponent />;
        case'monitoring':
        return (
          <Container sx={{ mt: 4 }}>
          <div>
            <h2>ResponseTeam Monitoring</h2>
            <MapContainer center={[14.6507, 121.1029]} zoom={13} style={{ height: '600px', width: '100%' }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {responseTeamLocations.map((location, index) => (
                <Marker key={index} position={[location.latitude, location.longitude]} icon={vehicleIcon}>
                  <Popup>
                    <strong>Response Team</strong> <br />
                    Last Updated: {new Date(location.timestamp).toLocaleString()}
                  </Popup>
                </Marker>
              ))}
            {confirmedReports.map((report, index) => (
                <Marker key={index} position={[report.Latitude, report.Longitude]} icon={defaultMarkerIcon}>
                  <Popup>
                    <strong>Name:</strong> {report.Name} <br />
                    <strong>Address:</strong> {report.Address} <br />
                    <strong>Report:</strong> {report.EmergencyType || report.ComplaintType} <br />
                    {report.MediaUrl && (
                      report.MediaUrl.endsWith('.jpg') || report.MediaUrl.endsWith('.png') ? (
                        <img src={report.MediaUrl} alt="Media" style={{ maxWidth: '100px' }} />
                      ) : (
                        <a href={report.MediaUrl} target="_blank" rel="noopener noreferrer">View Media</a>
                      )
                    )}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </Container>
        );
      case 'complaints':
        return (
          <Container sx={{ mt: 4 }}>
          <Typography variant="h5" gutterBottom>
              Complaints
          </Typography>
          <TableContainer component={Paper} sx={{ mb: 4 }}>
              <Table>
                  <TableHead>
                      <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell>Media</TableCell>
                          <TableCell>Emergency Code</TableCell>
                          <TableCell>Actions</TableCell>
                      </TableRow>
                  </TableHead>
                  <TableBody>
                      {complaints.map((complaint) => (
                          <TableRow key={complaint.Name}>
                              <TableCell>{complaint.Name}</TableCell>
                              <TableCell>{complaint.Address}</TableCell>
                              <TableCell>{complaint.ComplaintType}</TableCell>
                              <TableCell>{complaint.ComplaintText}</TableCell>
                              <TableCell>
                                  {complaint.MediaUrl ? (
                                      complaint.MediaUrl.endsWith('.jpg') || complaint.MediaUrl.endsWith('.jpeg') || complaint.MediaUrl.endsWith('.png') ? (
                                          <img src={complaint.MediaUrl} alt="complaint Media" style={{ maxWidth: '100px' }} />
                                      ) : (
                                          <a href={complaint.MediaUrl} target="_blank" rel="noopener noreferrer">View Media Upload</a>
                                      )
                                  ) : (
                                      'No media attached'
                                  )}
                              </TableCell>
                              <TableCell>
                                  <Select
                                      defaultValue=""
                                      onChange={(e) => setEmergencyCode(complaint.Name, e.target.value)}
                                      style={{ width: 150 }}
                                  >
                                      <MenuItem value="Code Red">Code Red</MenuItem>
                                      <MenuItem value="Code Yellow">Code Yellow</MenuItem>
                                      <MenuItem value="Code Blue">Code Blue</MenuItem>
                                  </Select>
                              </TableCell>
                              <TableCell>
                                  <Button onClick={() => handleConfirmComplaint(complaint.Name)} color="primary">Dispatch</Button>
                                  <Button onClick={() => handleDeleteComplaint(complaint.Name)} color="secondary">Delete</Button>
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </TableContainer>
          <TablePagination
              component="div"
              count={complaints.length}
              page={complaintPage}
              onPageChange={handleComplaintPageChange}
              rowsPerPage={complaintRowsPerPage}
              onRowsPerPageChange={handleComplaintRowsPerPageChange}
              ActionsComponent={CustomPaginationActions}
          />
      </Container>
        );
      case 'emergencies':
        return (
          <Container sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Emergencies
            </Typography>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Address</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Media</TableCell>
                    <TableCell>Emergency Code</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emergencies.map((emergency) => (
                    <TableRow key={emergency.Name}>
                      <TableCell>{emergency.Name}</TableCell>
                      <TableCell>{emergency.Address}</TableCell>
                      <TableCell>{emergency.EmergencyType}</TableCell>
                      <TableCell>{emergency.EmergencyText}</TableCell>
                      <TableCell>
                  {emergency.MediaUrl ? (
                    emergency.MediaUrl.endsWith('.jpg') || emergency.MediaUrl.endsWith('.jpeg') || emergency.MediaUrl.endsWith('.png') ? (
                      <img src={emergency.MediaUrl} alt="Emergency Media" style={{ maxWidth: '100px' }} />
                    ) : (
                      <a href={emergency.MediaUrl} target="_blank" rel="noopener noreferrer">View Media Upload</a>
                    )
                  ) : (
                    'No media attached'
                  )}
                </TableCell>
                <TableCell>
                       <Select
                        defaultValue=""
                        onChange={(e) => setEmergencyCode(emergency.Name, e.target.value)}
                        style={{ width: 150 }}
                        >
                        <MenuItem value="Code Red">Code Red</MenuItem>
                        <MenuItem value="Code Yellow">Code Yellow</MenuItem>
                        <MenuItem value="Code Blue">Code Blue</MenuItem>
                    </Select>
                  </TableCell>
                      <TableCell>
                        <Button onClick={() => handleConfirmEmergency(emergency.Name)} color="primary">Dispatch</Button>
                        <Button onClick={() => handleDeleteEmergency(emergency.Name)} color="secondary">Delete</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              component="div"
              count={emergencies.length}
              page={emergencyPage}
              onPageChange={handleEmergencyPageChange}
              rowsPerPage={emergencyRowsPerPage}
              onRowsPerPageChange={handleEmergencyRowsPerPageChange}
              ActionsComponent={CustomPaginationActions}
            />
          </Container>
        );
        case 'resolvedReports': // Add new case for resolved reports list
        return (
            <Container sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>Resolved Reports</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <TextField
                      label="Search by Name"
                      variant="outlined"
                      value={searchQuery}
                      onChange={handleSearchChange}
                      sx={{ width: '60%' }}
                  />
                  <FormControl sx={{ width: '35%' }}>
                      <InputLabel>Filter by</InputLabel>
                      <Select
                          value={filterType}
                          onChange={handleFilterChange}
                          label="Filter by"
                      >
                          <MenuItem value="all">All</MenuItem>
                          <MenuItem value="day">Today</MenuItem>
                          <MenuItem value="month">This Month</MenuItem>
                          <MenuItem value="year">This Year</MenuItem>
                      </Select>
                  </FormControl>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                  <Button variant="contained" color="primary" onClick={downloadExcel}>
                      Download Excel
                  </Button>
              </Box>
                {/* Resolved reports table */}
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Name</TableCell>
                                <TableCell>Address</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell>Media</TableCell>
                                <TableCell>Dispatch At</TableCell>
                                <TableCell>Resolved At</TableCell>
                                <TableCell>Resolved By</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                          
                        {filteredReports
                          .slice(
                            resolvedPage * resolvedRowsPerPage,
                            resolvedPage * resolvedRowsPerPage + resolvedRowsPerPage
                          )
                          .map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell>{report.Name}</TableCell>
                                    <TableCell>{report.Address}</TableCell>
                                    <TableCell>{report.Type}</TableCell>
                                    <TableCell>{report.Text}</TableCell>
                                    <TableCell>
                                        {report.MediaUrl ? (
                                            report.MediaUrl.endsWith('.jpg') || report.MediaUrl.endsWith('.png') ? (
                                                <img src={report.MediaUrl} alt="Media" style={{ maxWidth: '100px' }} />
                                            ) : (
                                                <a href={report.MediaUrl} target="_blank" rel="noopener noreferrer">View Media</a>
                                            )
                                        ) : 'No Media'}
                                    </TableCell>
                                    <TableCell>{new Date(report.ConfirmedAt).toLocaleString()}</TableCell>
                                    <TableCell>{new Date(report.ResolvedAt).toLocaleString()}</TableCell>
                                    <TableCell>{report.ResolvedBy}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                component="div"
                count={filteredReports.length}
                page={resolvedPage}
                onPageChange={(event, newPage) => setResolvedPage(newPage)}
                rowsPerPage={resolvedRowsPerPage}
                onRowsPerPageChange={(event) => {
                    setResolvedRowsPerPage(parseInt(event.target.value, 10));
                    setResolvedPage(0);
                }}
            />
            </Container>
        );

      default:
        return <Typography variant="h4" align="center">Welcome to the Dashboard</Typography>;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Admin Dashboard
          </Typography>
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { 
            width: drawerWidth, 
            boxSizing: 'border-box',
            backgroundColor: '#f8f9fa',
            borderRight: '1px solid #e0e0e0',
          },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          {/* Header Section */}
          <Box sx={{ 
            p: 2, 
            borderBottom: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            textAlign: 'center'
          }}>
            <PersonIcon sx={{ fontSize: 40, color: '#1976d2', mb: 1 }} />
            <Typography variant="h6" sx={{ color: '#1976d2', fontWeight: 600 }}>
              Admin Panel
            </Typography>
            <Typography variant="body2" sx={{ color: '#666', mt: 0.5 }}>
              Emergency Dispatch System
            </Typography>
          </Box>

          <List sx={{ pt: 1 }}>
            {/* Dashboard Section */}
            <ListItem 
              button 
              onClick={() => handleSectionChange('dashboard')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#e3f2fd',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'dashboard' && {
                  backgroundColor: '#e3f2fd',
                  borderLeft: '4px solid #1976d2',
                  '& .MuiListItemIcon-root': {
                    color: '#1976d2',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#1976d2',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <DashboardIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dashboard" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'dashboard' ? 600 : 400,
                }}
              />
            </ListItem>

            {/* Analytics Section */}
            <ListItem 
              button 
              onClick={() => handleSectionChange('resolvedReportsAnalytics')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#f3e5f5',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'resolvedReportsAnalytics' && {
                  backgroundColor: '#f3e5f5',
                  borderLeft: '4px solid #9c27b0',
                  '& .MuiListItemIcon-root': {
                    color: '#9c27b0',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#9c27b0',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AnalyticsIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Reports Analytics" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'resolvedReportsAnalytics' ? 600 : 400,
                }}
              />
            </ListItem>

            <Divider sx={{ my: 2, mx: 2 }} />

            {/* Monitoring Section */}
            <Typography variant="overline" sx={{ px: 3, py: 1, color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
              MONITORING
            </Typography>

            <ListItem 
              button 
              onClick={() => handleSectionChange('map')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#e8f5e9',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'map' && {
                  backgroundColor: '#e8f5e9',
                  borderLeft: '4px solid #4caf50',
                  '& .MuiListItemIcon-root': {
                    color: '#4caf50',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#4caf50',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <MapIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Area Report Map" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'map' ? 600 : 400,
                }}
              />
            </ListItem>

            <ListItem 
              button 
              onClick={() => handleSectionChange('monitoring')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'monitoring' && {
                  backgroundColor: '#fff3e0',
                  borderLeft: '4px solid #ff9800',
                  '& .MuiListItemIcon-root': {
                    color: '#ff9800',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#ff9800',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <LocalShippingIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Vehicle Monitoring" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'monitoring' ? 600 : 400,
                }}
              />
            </ListItem>

            <Divider sx={{ my: 2, mx: 2 }} />

            {/* Dispatch Section */}
            <Typography variant="overline" sx={{ px: 3, py: 1, color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
              DISPATCH
            </Typography>

            <ListItem 
              button 
              onClick={() => handleSectionChange('complaints')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#fff3e0',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'complaints' && {
                  backgroundColor: '#fff3e0',
                  borderLeft: '4px solid #ff9800',
                  '& .MuiListItemIcon-root': {
                    color: '#ff9800',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#ff9800',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <ReportIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dispatch Complaints" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'complaints' ? 600 : 400,
                }}
              />
            </ListItem>

            <ListItem 
              button 
              onClick={() => handleSectionChange('emergencies')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#ffebee',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'emergencies' && {
                  backgroundColor: '#ffebee',
                  borderLeft: '4px solid #f44336',
                  '& .MuiListItemIcon-root': {
                    color: '#f44336',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#f44336',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <SecurityIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Dispatch Emergencies" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'emergencies' ? 600 : 400,
                }}
              />
            </ListItem>

            <Divider sx={{ my: 2, mx: 2 }} />

            {/* Reports Section */}
            <Typography variant="overline" sx={{ px: 3, py: 1, color: '#666', fontWeight: 600, fontSize: '0.75rem' }}>
              REPORTS
            </Typography>

            <ListItem 
              button 
              onClick={() => handleSectionChange('resolvedReports')}
              sx={{
                mx: 1,
                mb: 0.5,
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#f3e5f5',
                  transform: 'translateX(4px)',
                  transition: 'all 0.2s ease-in-out',
                },
                ...(selectedSection === 'resolvedReports' && {
                  backgroundColor: '#f3e5f5',
                  borderLeft: '4px solid #9c27b0',
                  '& .MuiListItemIcon-root': {
                    color: '#9c27b0',
                  },
                  '& .MuiListItemText-primary': {
                    color: '#9c27b0',
                    fontWeight: 600,
                  },
                }),
              }}
            >
              <ListItemIcon sx={{ minWidth: 40 }}>
                <AssignmentIcon />
              </ListItemIcon>
              <ListItemText 
                primary="Resolved Reports" 
                primaryTypographyProps={{
                  fontSize: '0.95rem',
                  fontWeight: selectedSection === 'resolvedReports' ? 600 : 400,
                }}
              />
            </ListItem>
          </List>

          {/* Footer Section */}
          <Box sx={{ 
            mt: 'auto', 
            p: 2, 
            borderTop: '1px solid #e0e0e0',
            backgroundColor: '#fff',
            textAlign: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#999', display: 'block' }}>
              System Version 1.0
            </Typography>
            <Typography variant="caption" sx={{ color: '#999' }}>
              © 2024 Emergency Dispatch
            </Typography>
          </Box>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}>
        <Toolbar />
        {renderSection()}
      </Box>
    </Box>
  );
};
const DashboardMetrics = ({  
   newComplaintsCount,
   newEmergenciesCount,
   confirmedComplaints,
   confirmedEmergencies,
   activeResponseTeams,
   resolvedReportsCount, // New prop for resolved reports count
   onClickResolvedReports,
   onClickNewComplaints, 
    onClickNewEmergencies, 
    onClickOngoingReports

    
    }) => (
  <Box sx={{ mt: 4 }}>
    <Typography variant="h5" gutterBottom>Dashboard Overview</Typography>
    <Box
      sx={{
        display: 'grid',
        gap: 3,
        gridTemplateColumns: 'repeat(2, 1fr)',
        mb: 4,
      }}
    >
    <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#ffe0b2', color: '#f57c00' ,cursor: 'pointer'}}
      onClick={onClickNewComplaints} >
        <NotificationsActiveIcon sx={{ fontSize: 40, color: '#f57c00' }} />
        <Typography variant="h6">New Complaints</Typography>
        <Typography variant="h4">{newComplaintsCount}</Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#ffebee', color: '#e91e63',cursor: 'pointer' }}
       onClick={onClickNewEmergencies} >
        <NotificationsActiveIcon sx={{ fontSize: 40, color: '#e91e63' }} />
        <Typography variant="h6">New Emergencies</Typography>
        <Typography variant="h4">{newEmergenciesCount}</Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#e3f2fd', color: '#2196f3',cursor: 'pointer' }}
      onClick={onClickOngoingReports} >
        <CheckCircleIcon sx={{ fontSize: 40, color: '#2196f3' }} />
        <Typography variant="h6">Ongoing Complaints</Typography>
        <Typography variant="h4">{confirmedComplaints}</Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#ffebee', color: '#e91e63',cursor: 'pointer' }}
      onClick={onClickOngoingReports} >
        <ReportProblemIcon sx={{ fontSize: 40, color: '#e91e63' }} />
        <Typography variant="h6">Ongoing Emergencies</Typography>
        <Typography variant="h4">{confirmedEmergencies}</Typography>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, textAlign: 'center', backgroundColor: '#e8f5e9', color: '#4caf50',cursor: 'pointer'  }}
      onClick={onClickOngoingReports} >
        <GroupIcon sx={{ fontSize: 40, color: '#4caf50' }} />
        <Typography variant="h6">Active Response Teams</Typography>
        <Typography variant="h4">{activeResponseTeams}</Typography>
      </Paper>

      <Paper
        elevation={3}
        sx={{ 
          p: 3, 
          textAlign: 'center', 
          backgroundColor: '#d1c4e9', 
          color: '#673ab7', 
          cursor: 'pointer' 
        }}
        onClick={onClickResolvedReports} // Navigate to resolved reports list
      >
        <CheckCircleIcon sx={{ fontSize: 40, color: '#673ab7' }} />
        <Typography variant="h6">Resolved Reports</Typography>
        <Typography variant="h4">{resolvedReportsCount}</Typography>
      </Paper>
    </Box>
  </Box>
);

export default AdminPage;
