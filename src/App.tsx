import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'
import Home from './pages/Home'
import SignIn from './pages/SignIn'
import Enter from './pages/Enter'
import Standings from './pages/Standings'
import EntryDetail from './pages/EntryDetail'
import Admin from './pages/Admin'
import Drivers from './pages/Drivers'
import DriverDetail from './pages/DriverDetail'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 1 },
  },
})

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/enter" element={<Enter />} />
              <Route path="/standings" element={<Standings />} />
              <Route path="/entry/:id" element={<EntryDetail />} />
              <Route path="/drivers" element={<Drivers />} />
              <Route path="/driver/:carNumber" element={<DriverDetail />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  )
}
