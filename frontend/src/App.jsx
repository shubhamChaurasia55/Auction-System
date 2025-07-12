import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SideDrawer from './layout/SideDrawer.jsx';

const App = () => {
  return (
    <Router>
      <SideDrawer />
      <Routes>
        <Route path='/' element={<Home />} />
      </Routes>
      <ToastContainer position='top-right'/>
    </Router>
  )
}

export default App;