import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { WalletProvider } from './wallet/WalletContext'
import { GroupListPage } from './pages/GroupListPage'
import { GroupDetailPage } from './pages/GroupDetailPage'
import { CreateGroupPage } from './pages/CreateGroupPage'
import { RunnerDashboardPage } from './pages/RunnerDashboardPage'
import { TitiperOrdersPage } from './pages/TitiperOrdersPage'

// BrowserRouter wraps WalletProvider so useNavigate is available inside the context
export default function App() {
  return (
    <BrowserRouter>
      <WalletProvider>
        <Routes>
          <Route path="/" element={<GroupListPage />} />
          <Route path="/groups/:groupId" element={<GroupDetailPage />} />
          <Route path="/runner/groups/new" element={<CreateGroupPage />} />
          <Route path="/runner/dashboard" element={<RunnerDashboardPage />} />
          <Route path="/my-orders" element={<TitiperOrdersPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </WalletProvider>
    </BrowserRouter>
  )
}
