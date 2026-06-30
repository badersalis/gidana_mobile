import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  View,
} from 'react-native';
import styles from './ConversationsScreen.styles';
import { ActivityIndicator, Avatar, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { messagingApi } from '../../api/messaging';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useAuthStore } from '../../store/authStore';
import { Conversation, Message } from '../../types';
import { formatDate } from '../../utils/currency';
import { COLORS } from '../../utils/theme';
import PlansModal from '../../components/PlansModal';

export default function ConversationsScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plansVisible, setPlansVisible] = useState(false);

  const isBasic = !user?.subscription_plan || user?.subscription_plan === 'basic';

  const load = useCallback(async () => {
    try {
      const { data } = await messagingApi.getConversations();
      setConversations(data.data ?? []);
    } catch (e) {
      console.error('[Conversations] load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user) load();
    else setLoading(false);
  }, [user, load]);

  const handleNewMessage = useCallback((msg: Message) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === msg.conversation_id
          ? { ...c, last_message: msg, unread_count: (c.unread_count ?? 0) + 1 }
          : c
      )
    );
  }, []);

  useWebSocket(handleNewMessage, !!user);

  if (!user) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
        <Text style={styles.emptyTitle}>{t('conversations.loginPrompt')}</Text>
        <TouchableOpacity
          style={styles.loginBtn}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.loginBtnText}>{t('conversations.signIn')}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('conversations.header')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Upgrade banner for basic users */}
      {isBasic && (
        <TouchableOpacity style={styles.upgradeBanner} onPress={() => setPlansVisible(true)} activeOpacity={0.85}>
          <Ionicons name="lock-closed-outline" size={16} color="#fff" />
          <Text style={styles.upgradeBannerText}>{t('conversations.upgradeBanner')}</Text>
          <Text style={styles.upgradeBannerBtn}>{t('conversations.upgradeBtn')}</Text>
        </TouchableOpacity>
      )}

      {conversations.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="chatbubbles-outline" size={64} color={COLORS.textLight} />
          <Text style={styles.emptyTitle}>{t('conversations.noConversations')}</Text>
          <Text style={styles.emptySubtext}>{t('conversations.noConversationsDesc')}</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(c) => String(c.id)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                load();
              }}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          renderItem={({ item }) => (
            <ConversationRow item={item} userId={user.id} showUnread={!isBasic} />
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      <PlansModal
        visible={plansVisible}
        onClose={() => setPlansVisible(false)}
        defaultTab="seekers"
      />
    </SafeAreaView>
  );
}

function ConversationRow({
  item,
  userId,
  showUnread,
}: {
  item: Conversation;
  userId: number;
  showUnread: boolean;
}) {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const [imgError, setImgError] = useState(false);
  const other = userId === item.owner_id ? item.tenant : item.owner;
  const name =
    `${other?.first_name ?? ''} ${other?.last_name ?? ''}`.trim() || t('conversations.unknownUser');
  const initials = `${other?.first_name?.[0] ?? ''}${other?.last_name?.[0] ?? ''}`.toUpperCase();
  const contact = other?.phone_number ?? other?.email ?? null;
  const preview = item.last_message?.content ?? item.property?.title ?? t('conversations.newConversation');
  const showImage = !!other?.profile_picture && !imgError;
  const unread = showUnread && (item.unread_count ?? 0) > 0 ? item.unread_count : 0;

  return (
    <TouchableOpacity
      style={styles.row}
      activeOpacity={0.7}
      onPress={() =>
        navigation.navigate('Chat', {
          conversationId: item.id,
          name,
          otherUserAvatar: other?.profile_picture ?? undefined,
          otherUserInitials: initials || undefined,
        })
      }
    >
      {showImage ? (
        <Image
          source={{ uri: other!.profile_picture }}
          style={styles.avatar}
          onError={() => setImgError(true)}
        />
      ) : initials ? (
        <Avatar.Text
          size={52}
          label={initials}
          style={{ backgroundColor: COLORS.primary + 'cc' }}
          labelStyle={{ fontFamily: 'Poppins-SemiBold', color: '#fff' }}
        />
      ) : (
        <View style={styles.avatarPlaceholder}>
          <Ionicons name="person-outline" size={26} color={COLORS.primary} />
        </View>
      )}
      <View style={styles.rowContent}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowName, !!unread && styles.rowNameUnread]} numberOfLines={1}>
            {name}
          </Text>
          <View style={styles.rowMeta}>
            {item.last_message && (
              <Text style={styles.rowTime}>{formatDate(item.last_message.created_at)}</Text>
            )}
            {!!unread && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>{unread > 99 ? '99+' : unread}</Text>
              </View>
            )}
          </View>
        </View>
        {contact ? (
          <Text style={styles.rowContact}>{contact}</Text>
        ) : null}
        {item.property && (
          <Text style={styles.rowProperty} numberOfLines={1}>
            {item.property.title}
          </Text>
        )}
        <Text style={[styles.rowPreview, !!unread && styles.rowPreviewUnread]} numberOfLines={1}>
          {preview}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
