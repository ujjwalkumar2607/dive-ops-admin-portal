// src/services/useAuth.js
import { useState, useEffect } from 'react';
import { jwtDecode} from 'jwt-decode';

export function useAuth() {
  const [role, setRole] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // decode returns the payload object
      const { role } = jwtDecode(token);
      setRole(role);
    } catch {
      setRole(null);
    }
  }, []);

  return { role };
}
