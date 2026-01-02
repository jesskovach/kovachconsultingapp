import Dashboard from './pages/Dashboard';
import Clients from './pages/Clients';
import ClientDetail from './pages/ClientDetail';
import Sessions from './pages/Sessions';
import Pipeline from './pages/Pipeline';
import Onboarding from './pages/Onboarding';
import OnboardingDetail from './pages/OnboardingDetail';
import Reports from './pages/Reports';
import ClientPortal from './pages/ClientPortal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Dashboard": Dashboard,
    "Clients": Clients,
    "ClientDetail": ClientDetail,
    "Sessions": Sessions,
    "Pipeline": Pipeline,
    "Onboarding": Onboarding,
    "OnboardingDetail": OnboardingDetail,
    "Reports": Reports,
    "ClientPortal": ClientPortal,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};