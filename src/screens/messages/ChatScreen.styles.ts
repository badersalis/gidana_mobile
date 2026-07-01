import { StyleSheet } from 'react-native';
import { COLORS } from '../../utils/theme';

// Sent (mine):  dark green brand color — white text
// Received:     very light warm gray — dark text, clear contrast
const BUBBLE_MINE_BG   = COLORS.primary;          // #0d5c03
const BUBBLE_OTHER_BG  = '#f0f4f0';               // subtle green-tinted gray

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e9efe9' },

  // ── Header ──────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerAvatar: {
    backgroundColor: COLORS.primary + 'cc',
  },
  headerAvatarIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + 'cc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerName: {
    flex: 1,
    fontFamily: 'Poppins-SemiBold',
    fontSize: 16,
    color: '#fff',
  },

  // ── Center / loading ────────────────────────────────────
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // ── Message list ────────────────────────────────────────
  messageList: {
    paddingHorizontal: 10,
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyChat: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyChatText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#999',
  },

  // ── Bubble rows (wraps avatar + bubble) ─────────────────
  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 6,
    alignSelf: 'flex-start',
    maxWidth: '88%',
  },
  bubbleRowMine: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginBottom: 6,
    alignSelf: 'flex-end',
    maxWidth: '88%',
  },

  // ── Bubble base ─────────────────────────────────────────
  bubble: {
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 18,
    marginBottom: 0,
  },
  bubbleMine: {
    flex: 1,
    backgroundColor: BUBBLE_MINE_BG,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    flex: 1,
    backgroundColor: BUBBLE_OTHER_BG,
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  bubbleInRow: {
    alignSelf: 'auto',
    maxWidth: '100%',
  },

  // ── Bubble text & time ──────────────────────────────────
  bubbleText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  bubbleTextMine:  { color: '#fff' },
  bubbleTextOther: { color: '#1a1a1a' },
  bubbleTime: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  bubbleTimeMine:  { color: 'rgba(255,255,255,0.65)' },
  bubbleTimeOther: { color: '#888' },

  // ── Avatars beside bubbles ──────────────────────────────
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ddd',
  },
  bubbleAvatarInitials: {
    backgroundColor: COLORS.primary + 'cc',
  },
  bubbleAvatarIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Blurred / locked messages ───────────────────────────
  bubbleTextBlurred: {
    letterSpacing: -2,
    opacity: 0.15,
  },
  blurOverlay: {
    position: 'absolute',
    inset: 0,
    borderRadius: 18,
    backgroundColor: 'rgba(20,20,20,0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
  blurLabel: {
    fontFamily: 'Poppins-SemiBold',
    fontSize: 12,
    color: '#fff',
  },

  // ── Input bar ───────────────────────────────────────────
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 8,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: '#f4f4f4',
    borderRadius: 20,
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#1a1a1a',
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: '#c8c8c8',
  },
  lockedInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  lockedInputText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#aaa',
  },
});
