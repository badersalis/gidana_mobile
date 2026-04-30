import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 32 },
  logoBadge: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  title: { fontSize: 28, fontFamily: 'Poppins-Bold', color: '#111', marginBottom: 4 },
  subtitle: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
  form: { gap: 4 },
  input: { backgroundColor: '#fff', fontFamily: 'Poppins-Regular' },
  serverError: { textAlign: 'center', fontSize: 13 },
  button: { marginTop: 8, borderRadius: 50 },
  buttonContent: { paddingVertical: 6, height: 50 },
  registerLink: { alignItems: 'center', paddingVertical: 12 },
  registerText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
  guestLink: { alignItems: 'center', paddingVertical: 8 },
  guestText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: COLORS.textLight,
    textDecorationLine: 'underline',
  },
});
