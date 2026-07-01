import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import styles from './ChatScreen.styles';
import { ActivityIndicator, Avatar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { messagingApi } from '../../api/messaging';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types';
import { COLORS } from '../../utils/theme';
import PlansModal from '../../components/PlansModal';

const NAME_LIMIT = 22;
function truncateName(n: string) {
  return n.length > NAME_LIMIT ? n.substring(0, NAME_LIMIT).trimEnd() + '…' : n;
}

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { conversationId, name, autoMessage, otherUserAvatar, otherUserInitials } =
    route.params as {
      conversationId: number;
      name: string;
      autoMessage?: string;
      otherUserAvatar?: string;
      otherUserInitials?: string;
    };
  const displayName = truncateName(name);
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  const myAvatar = user?.profile_picture ?? undefined;
  const myInitials =
    `${user?.first_name?.[0] ?? ''}${user?.last_name?.[0] ?? ''}`.toUpperCase() || undefined;

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [plansVisible, setPlansVisible] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);
  const autoMessageSent = useRef(false);

  const isBasic = !user?.subscription_plan || user?.subscription_plan === 'basic';

  const load = useCallback(async () => {
    try {
      const { data } = await messagingApi.getConversation(conversationId);
      setMessages((data.data.messages ?? []).slice().reverse());
    } catch (e) {
      console.error('[Chat] load error:', e);
    } finally {
      setLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || autoMessageSent.current || !autoMessage) return;
    if (messages.length > 0) { autoMessageSent.current = true; return; }
    autoMessageSent.current = true;
    messagingApi.sendMessage(conversationId, autoMessage).then(({ data }) => {
      setMessages([data.data]);
    }).catch(() => {});
  }, [loading, messages.length, autoMessage, conversationId]);

  useEffect(() => {
    if (loading || !isBasic) return;
    const ownerReplied = messages.some((m) => m.sender_id !== user?.id);
    if (ownerReplied) setPlansVisible(true);
  }, [loading, messages, isBasic, user?.id]);

  const handleNewMessage = useCallback(
    (msg: Message) => {
      if (msg.conversation_id !== conversationId) return;
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) return prev;
        return [msg, ...prev];
      });
    },
    [conversationId]
  );

  useWebSocket(handleNewMessage);

  async function handleSend() {
    const content = text.trim();
    if (!content || sending) return;
    if (isBasic && messages.some((m) => m.sender_id !== user?.id)) {
      setPlansVisible(true);
      return;
    }
    setText('');
    setSending(true);
    try {
      const { data } = await messagingApi.sendMessage(conversationId, content);
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.data.id);
        if (exists) return prev;
        return [data.data, ...prev];
      });
    } catch {
      setText(content);
      Alert.alert(t('common.error'), t('chat.sendError'));
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(msgId: number) {
    Alert.alert(t('chat.deleteTitle'), t('chat.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('chat.deleteTitle'),
        style: 'destructive',
        onPress: async () => {
          try {
            await messagingApi.deleteMessage(conversationId, msgId);
            setMessages((prev) => prev.filter((m) => m.id !== msgId));
          } catch {
            Alert.alert(t('common.error'), t('chat.deleteError'));
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header — green bar with back, avatar, name */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        {otherUserAvatar ? (
          <Avatar.Image
            size={36}
            source={{ uri: otherUserAvatar }}
            style={styles.headerAvatar}
          />
        ) : otherUserInitials ? (
          <Avatar.Text
            size={36}
            label={otherUserInitials}
            style={styles.headerAvatar}
            labelStyle={{ fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 14 }}
          />
        ) : (
          <View style={styles.headerAvatarIcon}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
        )}
        <Text style={styles.headerName} numberOfLines={1}>
          {displayName}
        </Text>
      </View>

      {/* Messages */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          inverted
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user?.id;
            const blurred = !isMine && isBasic;
            return (
              <MessageBubble
                msg={item}
                isMine={isMine}
                blurred={blurred}
                otherUserAvatar={otherUserAvatar}
                otherUserInitials={otherUserInitials}
                myAvatar={myAvatar}
                myInitials={myInitials}
                onLongPress={() => { if (isMine) handleDeleteMessage(item.id); }}
                onBlurTap={() => setPlansVisible(true)}
              />
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>{t('chat.startConversation')}</Text>
            </View>
          }
        />
      )}

      {/* Input bar */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {isBasic && messages.some((m) => m.sender_id !== user?.id) ? (
          <TouchableOpacity
            style={styles.lockedInput}
            onPress={() => setPlansVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#aaa" />
            <Text style={styles.lockedInputText}>{t('plans.unlockToRead')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder={t('chat.messagePlaceholder')}
              placeholderTextColor="#aaa"
              value={text}
              onChangeText={setText}
              multiline
              maxLength={1000}
              returnKeyType="send"
              onSubmitEditing={handleSend}
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size={18} color="#fff" />
              ) : (
                <Ionicons name="send" size={18} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>

      <PlansModal
        visible={plansVisible}
        onClose={() => setPlansVisible(false)}
        defaultTab="seekers"
      />
    </SafeAreaView>
  );
}

function MessageBubble({
  msg,
  isMine,
  blurred,
  onLongPress,
  onBlurTap,
  otherUserAvatar,
  otherUserInitials,
  myAvatar,
  myInitials,
}: {
  msg: Message;
  isMine: boolean;
  blurred: boolean;
  onLongPress: () => void;
  onBlurTap: () => void;
  otherUserAvatar?: string;
  otherUserInitials?: string;
  myAvatar?: string;
  myInitials?: string;
}) {
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const [myImgError, setMyImgError] = useState(false);
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const showOtherImage = !!otherUserAvatar && !imgError;
  const showMyImage = !!myAvatar && !myImgError;

  const bubble = (
    <TouchableOpacity
      activeOpacity={blurred ? 1 : 0.85}
      onLongPress={onLongPress}
      onPress={blurred ? onBlurTap : undefined}
      style={[
        styles.bubble,
        isMine ? styles.bubbleMine : styles.bubbleOther,
        styles.bubbleInRow,
      ]}
    >
      <Text
        style={[
          styles.bubbleText,
          isMine ? styles.bubbleTextMine : styles.bubbleTextOther,
          blurred && styles.bubbleTextBlurred,
        ]}
      >
        {blurred ? msg.content.replace(/./g, '●') : msg.content}
      </Text>
      {blurred && (
        <View style={styles.blurOverlay}>
          <Ionicons name="lock-closed" size={14} color="#fff" />
          <Text style={styles.blurLabel}>{t('plans.unlockToRead')}</Text>
        </View>
      )}
      {!blurred && (
        <Text
          style={[
            styles.bubbleTime,
            isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther,
          ]}
        >
          {time}
        </Text>
      )}
    </TouchableOpacity>
  );

  const avatarNode = isMine ? (
    showMyImage ? (
      <Image
        source={{ uri: myAvatar }}
        style={styles.bubbleAvatar}
        onError={() => setMyImgError(true)}
      />
    ) : myInitials ? (
      <Avatar.Text
        size={28}
        label={myInitials}
        style={styles.bubbleAvatarInitials}
        labelStyle={{ fontFamily: 'Poppins-SemiBold', fontSize: 10, color: '#fff' }}
      />
    ) : (
      <View style={styles.bubbleAvatarIcon}>
        <Ionicons name="person" size={14} color={COLORS.primary} />
      </View>
    )
  ) : showOtherImage ? (
    <Image
      source={{ uri: otherUserAvatar }}
      style={styles.bubbleAvatar}
      onError={() => setImgError(true)}
    />
  ) : otherUserInitials ? (
    <Avatar.Text
      size={28}
      label={otherUserInitials}
      style={styles.bubbleAvatarInitials}
      labelStyle={{ fontFamily: 'Poppins-SemiBold', fontSize: 10, color: '#fff' }}
    />
  ) : (
    <View style={styles.bubbleAvatarIcon}>
      <Ionicons name="person" size={14} color={COLORS.primary} />
    </View>
  );

  return (
    <View style={isMine ? styles.bubbleRowMine : styles.bubbleRow}>
      {!isMine && avatarNode}
      {bubble}
      {isMine && avatarNode}
    </View>
  );
}
