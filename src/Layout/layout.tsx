import Header from '../components/Navbar/navbar';
import { Outlet } from 'react-router-dom';

const Layout = () => {
    return (
        <div>
        <Header />
        <div className="flex-1 pr-[55px]">
            <Outlet />
        </div>
     </div>
    );
    };       

export default Layout;