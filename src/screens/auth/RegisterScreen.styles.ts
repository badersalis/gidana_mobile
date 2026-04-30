import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  scroll: { flexGrow: 1, padding: 24 },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 32, fontFamily: 'Poppins-Bold', color: COLORS.primary, marginBottom: 8 },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Poppins-Regular',
    color: COLORS.textLight,
    marginBottom: 32,
  },
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  halfField: { flex: 1 },
  input: { backgroundColor: '#fff', fontFamily: 'Poppins-Regular' },
  segmented: { marginBottom: 4 },
  serverError: { textAlign: 'center', fontSize: 13 },
  button: { marginTop: 8, borderRadius: 50 },
  buttonContent: { paddingVertical: 6, height: 50 },
  loginLink: { alignItems: 'center', paddingVertical: 12 },
  loginText: { fontFamily: 'Poppins-Regular', fontSize: 14, color: COLORS.textLight },
});
