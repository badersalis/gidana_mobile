import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
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
import { messagingApi } from '../../api/messaging';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import { Message } from '../../types';
import { COLORS } from '../../utils/theme';

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { conversationId, name } = route.params as { conversationId: number; name: string };
  const user = useAuthStore((s) => s.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList<Message>>(null);

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
    setText('');
    setSending(true);
    try {
      const { data } = await messagingApi.sendMessage(conversationId, content);
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === data.data.id);
        if (exists) return prev;
        return [data.data, ...prev];
      });
    } catch (e) {
      setText(content);
      Alert.alert('Erreur', 'Impossible d\'envoyer le message');
    } finally {
      setSending(false);
    }
  }

  async function handleDeleteMessage(msgId: number) {
    Alert.alert('Supprimer', 'Supprimer ce message ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await messagingApi.deleteMessage(conversationId, msgId);
            setMessages((prev) => prev.filter((m) => m.id !== msgId));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer le message');
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Avatar.Text
          size={36}
          label={(name[0] ?? '?').toUpperCase()}
          style={{ backgroundColor: COLORS.primary + 'cc' }}
          labelStyle={{ fontFamily: 'Poppins-SemiBold', color: '#fff', fontSize: 14 }}
        />
        <Text style={styles.headerName} numberOfLines={1}>
          {name}
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
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isMine={item.sender_id === user?.id}
              onLongPress={() => {
                if (item.sender_id === user?.id) handleDeleteMessage(item.id);
              }}
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>Démarrez la conversation !</Text>
            </View>
          }
        />
      )}

      {/* Input */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Votre message..."
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
              <Ionicons name="send" size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function MessageBubble({
  msg,
  isMine,
  onLongPress,
}: {
  msg: Message;
  isMine: boolean;
  onLongPress: () => void;
}) {
  const time = new Date(msg.created_at).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onLongPress={onLongPress}
      style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleOther]}
    >
      <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
        {msg.content}
      </Text>
      <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeOther]}>
        {time}
      </Text>
    </TouchableOpacity>
  );
}

