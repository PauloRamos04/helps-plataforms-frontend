import React, { useState } from 'react';
import {
  Box, Typography, Paper, Tabs, Tab
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import UserList from '../components/users/UserList';
import UserForm from '../components/users/UserForm';
import PageHeader from '../components/common/PageHeader';

function UserManagement() {
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // Custom TabPanel component
  const TabPanel = (props) => {
    const { children, value, index, ...other } = props;

    return (
      <div
        role="tabpanel"
        hidden={value !== index}
        id={`tabpanel-${index}`}
        {...other}
        style={{ padding: '16px 0' }}
      >
        {value === index && (
          <Box>
            {children}
          </Box>
        )}
      </div>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper
        elevation={0}
        sx={{
          borderRadius: '8px',
          p: 3,
          mb: 3
        }}
      >
        <PageHeader 
          title="Gerenciamento de Usuários"
          backUrl="/dashboard"
        />

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange}>
              <Tab label="Listar Usuários" id="tab-0" />
              <Tab label="Criar Usuário" id="tab-1" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <UserList />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <UserForm onSuccess={() => setTabValue(0)} />
          </TabPanel>
        </Box>
      </Paper>
    </Box>
  );
}

export default UserManagement;