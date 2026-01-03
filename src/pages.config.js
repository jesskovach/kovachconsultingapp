import CalendlySettings from './pages/CalendlySettings';
import ClientDetail from './pages/ClientDetail';
import ClientHistory from './pages/ClientHistory';
import ClientIntake from './pages/ClientIntake';
import ClientPortal from './pages/ClientPortal';
import Clients from './pages/Clients';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import OnboardingDetail from './pages/OnboardingDetail';
import OnboardingTemplates from './pages/OnboardingTemplates';
import PaymentSettings from './pages/PaymentSettings';
import Pipeline from './pages/Pipeline';
import ReminderSettings from './pages/ReminderSettings';
import Reports from './pages/Reports';
import Resources from './pages/Resources';
import Sessions from './pages/Sessions';
import Team from './pages/Team';
import __Layout from './Layout.jsx';


export const PAGES = {
    "CalendlySettings": CalendlySettings,
    "ClientDetail": ClientDetail,
    "ClientHistory": ClientHistory,
    "ClientIntake": ClientIntake,
    "ClientPortal": ClientPortal,
    "Clients": Clients,
    "Dashboard": Dashboard,
    "Onboarding": Onboarding,
    "OnboardingDetail": OnboardingDetail,
    "OnboardingTemplates": OnboardingTemplates,
    "PaymentSettings": PaymentSettings,
    "Pipeline": Pipeline,
    "ReminderSettings": ReminderSettings,
    "Reports": Reports,
    "Resources": Resources,
    "Sessions": Sessions,
    "Team": Team,
}

export const pagesConfig = {
    mainPage: "Dashboard",
    Pages: PAGES,
    Layout: __Layout,
};