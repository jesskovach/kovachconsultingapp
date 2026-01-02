import ClientDetail from './pages/ClientDetail';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import OnboardingDetail from './pages/OnboardingDetail';
import Pipeline from './pages/Pipeline';
import Reports from './pages/Reports';
import Sessions from './pages/Sessions';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ClientDetail": ClientDetail,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Onboarding": Onboarding,
    "OnboardingDetail": OnboardingDetail,
    "Pipeline": Pipeline,
    "Reports": Reports,
    "Sessions": Sessions,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};