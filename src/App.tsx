import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { AuthProvider } from './auth/AuthProvider.tsx'
import RequireAuth from './auth/RequireAuth.tsx'
import Layout from './pages/Layout.tsx'
import Overview from './pages/Overview.tsx'
import SignIn from './pages/SignIn.tsx'

const Setup = lazy(() => import('./pages/Setup.tsx'))
const Couples = lazy(() => import('./pages/Couples.tsx'))
const CoupleDetail = lazy(() => import('./pages/CoupleDetail.tsx'))
const Vendors = lazy(() => import('./pages/Vendors.tsx'))
const VendorDetail = lazy(() => import('./pages/VendorDetail.tsx'))
const Payments = lazy(() => import('./pages/Payments.tsx'))
const Activity = lazy(() => import('./pages/Activity.tsx'))
const Staff = lazy(() => import('./pages/Staff.tsx'))
const NotFound = lazy(() => import('./pages/NotFound.tsx'))

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <a href="#main" className="skip-link">Skip to content</a>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/signin" element={<SignIn />} />
            <Route path="/setup/:token" element={<Setup />} />
            <Route element={<RequireAuth />}>
              <Route element={<Layout />}>
                <Route index element={<Overview />} />
                <Route path="couples" element={<Couples />} />
                <Route path="couples/:id" element={<CoupleDetail />} />
                <Route path="vendors" element={<Vendors />} />
                <Route path="vendors/:id" element={<VendorDetail />} />
                <Route path="payments" element={<Payments />} />
                <Route path="activity" element={<Activity />} />
                <Route path="staff" element={<Staff />} />
                <Route path="*" element={<NotFound />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}
