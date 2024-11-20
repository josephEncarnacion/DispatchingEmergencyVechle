import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: {
      main: '#050c9c', // Dark Blue
    },
    secondary: {
      main: '#3572ef', // Blue
    },
    info: {
      main: '#3abef3', // Light Blue
    },
    background: {
      default: '#3abef3', // Light Blue as background
    },
    text: {
      primary: '#050c9c', // Dark Blue for text
    },
  },
  typography: {
    fontFamily: 'Arial, sans-serif',
  },
});

export default theme;
