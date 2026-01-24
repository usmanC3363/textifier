/**
 * Re-export useAuth hook from AuthProvider for feature-based access
 * This maintains consistency with the architecture where features
 * have their own hooks directory
 */
export { useAuth } from '@/providers/AuthProvider';
