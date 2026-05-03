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

  privacyConsent: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  privacyLink: {
    fontFamily: 'Poppins-SemiBold',
    color: COLORS.primary,
    textDecorationLine: 'underline',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 17,
    color: '#333',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingBottom: 32,
  },
  policySectionTitle: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 14,
    color: '#333',
    marginTop: 18,
    marginBottom: 6,
  },
  policyText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
  policyFooter: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  policyFooterText: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 13,
    color: COLORS.primary,
  },
  policyFooterSub: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
});
