import GlobalStyles from '@mui/material/GlobalStyles'
import {
  createTheme,
  StyledEngineProvider,
  ThemeProvider,
} from '@mui/material/styles'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'

const theme = createTheme({
  palette: {
    primary: { main: '#087f76', dark: '#06665f', contrastText: '#ffffff' },
    text: { primary: '#18352f', secondary: '#60756b' },
    background: { default: '#f5f8f5', paper: '#ffffff' },
    error: { main: '#b42318' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Plus Jakarta Sans", Inter, system-ui, sans-serif',
    button: { textTransform: 'none', fontWeight: 700 },
  },
})

const root = document.getElementById('root')
if (!root) throw new Error('App root is missing')

createRoot(root).render(
  <StrictMode>
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <App />
      </ThemeProvider>
    </StyledEngineProvider>
  </StrictMode>,
)
