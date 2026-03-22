import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { 
  isSubscribedToRiver,
  unsubscribeFromRiverNotifications,
  getSubscribedRivers,
} from '../utils/notifications';
import { isTrialActive } from '../hooks/trialManager';
import { checkCachedPremiumStatus } from '../hooks/useRevenueCat';

const Stepper = ({ value, min, max, step, onChange }) => {
  const decrease = () => onChange(Math.max(min, value - step));
  const increase = () => onChange(Math.min(max, value + step));
  
  return (
    <View style={styles.stepperContainer}>
      <TouchableOpacity onPress={decrease} style={styles.stepperButton}>
        <MaterialIcons name="remove" size={20} color={COLORS.primary} />
      </TouchableOpacity>
      <Text style={styles.stepperValue}>{value}</Text>
      <TouchableOpacity onPress={increase} style={styles.stepperButton}>
        <MaterialIcons name="add" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );
};

const COLORS = {
  primary: '#2d4a3e',
  primaryDark: '#1a2f27',
  accent: '#c9a227',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  text: '#2c2416',
  textLight: '#6b5d4d',
  textMuted: '#9a8b7a',
  success: '#5a7d5a',
  warning: '#d4a574',
  error: '#a65d57',
};

const SettingsScreen = ({ navigation }) => {
  const [isPremium, setIsPremium] = useState(false);
  const [subscribedRivers, setSubscribedRivers] = useState([]);
  
  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [dailyBriefing, setDailyBriefing] = useState(true);
  const [hatchAlerts, setHatchAlerts] = useState(true);
  
  // HatchCast Score Alerts
  const [scoreAlertsEnabled, setScoreAlertsEnabled] = useState(true);
  const [scoreThreshold, setScoreThreshold] = useState(85);
  
  // Flow Spike Warnings
  const [flowSpikeAlertsEnabled, setFlowSpikeAlertsEnabled] = useState(true);
  const [flowSpikeThreshold, setFlowSpikeThreshold] = useState(300);
  const [dangerousFlowAlerts, setDangerousFlowAlerts] = useState(true);
  
  // Weather Alerts
  const [weatherAlertsEnabled, setWeatherAlertsEnabled] = useState(false);
  const [windAlerts, setWindAlerts] = useState(true);
  const [tempAlerts, setTempAlerts] = useState(true);
  
  // Solunar Alerts
  const [solunarAlertsEnabled, setSolunarAlertsEnabled] = useState(false);
  const [solunarReminderMinutes, setSolunarReminderMinutes] = useState(30);
  
  const [modalVisible, setModalVisible] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    loadSettings();
    loadSubscribedRivers();
    checkPremiumStatus();
    
    // Check if we should open a modal from navigation params
    const checkModalParam = () => {
      const modalToOpen = navigation.getParam?.('openModal') || navigation.params?.openModal;
      if (modalToOpen && contentData[modalToOpen]) {
        // Small delay to allow screen to render first
        setTimeout(() => {
          openModal(modalToOpen);
          // Clear the param after opening
          navigation.setParams?.({ openModal: null });
        }, 300);
      }
    };
    
    checkModalParam();
    
    // Refresh when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadSubscribedRivers();
      checkPremiumStatus();
      checkModalParam();
    });
    
    // Also refresh periodically to catch changes from other screens
    const interval = setInterval(() => {
      loadSubscribedRivers();
    }, 2000);
    
    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [navigation]);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        
        // Basic notifications
        setNotificationsEnabled(parsed.notificationsEnabled !== false);
        setDailyBriefing(parsed.dailyBriefing !== false);
        setHatchAlerts(parsed.hatchAlerts !== false);
        
        // Smart Notifications
        setScoreAlertsEnabled(parsed.scoreAlertsEnabled !== false);
        setScoreThreshold(Number(parsed.scoreThreshold || 85));
        
        setFlowSpikeAlertsEnabled(parsed.flowSpikeAlertsEnabled !== false);
        setFlowSpikeThreshold(Number(parsed.flowSpikeThreshold || 300));
        setDangerousFlowAlerts(parsed.dangerousFlowAlerts !== false);
        
        setWeatherAlertsEnabled(parsed.weatherAlertsEnabled === true);
        setWindAlerts(parsed.windAlerts !== false);
        setTempAlerts(parsed.tempAlerts !== false);
        
        setSolunarAlertsEnabled(parsed.solunarAlertsEnabled === true);
        setSolunarReminderMinutes(Number(parsed.solunarReminderMinutes || 30));
      }
    } catch (e) {
      console.log('Error loading settings:', e);
    }
  };

  const saveSettings = async (key, value) => {
    try {
      const settings = await AsyncStorage.getItem('userSettings');
      const parsed = settings ? JSON.parse(settings) : {};
      parsed[key] = value;
      await AsyncStorage.setItem('userSettings', JSON.stringify(parsed));
    } catch (e) {
      console.log('Error saving settings:', e);
    }
  };

  const loadSubscribedRivers = async () => {
    try {
      const subscribed = await getSubscribedRivers();
      setSubscribedRivers(subscribed);
    } catch (e) {
      console.log('Error loading subscribed rivers:', e);
    }
  };

  const checkPremiumStatus = async () => {
    try {
      // Check RevenueCat premium status
      const { isPremium: rcPremium } = await checkCachedPremiumStatus();
      // Check trial status
      const trialActive = await isTrialActive();
      // Check legacy API key
      const apiKey = await AsyncStorage.getItem('apiKey');
      
      const hasPremium = rcPremium || trialActive || !!apiKey;
      setIsPremium(hasPremium);
    } catch (e) {
      console.log('Error checking premium:', e);
    }
  };

  const toggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await saveSettings('notificationsEnabled', value);
    
    if (!value) {
      // Disable all notifications
      Alert.alert(
        'Disable All Notifications?',
        'This will unsubscribe you from all river notifications.',
        [
          { text: 'Cancel', style: 'cancel', onPress: () => setNotificationsEnabled(true) },
          { 
            text: 'Disable All', 
            style: 'destructive',
            onPress: async () => {
              for (const river of subscribedRivers) {
                await unsubscribeFromRiverNotifications(river);
              }
              setSubscribedRivers([]);
              await AsyncStorage.setItem('subscribedRivers', JSON.stringify([]));
            }
          }
        ]
      );
    }
  };

  const unsubscribeFromRiver = async (river) => {
    const success = await unsubscribeFromRiverNotifications(river);
    if (success) {
      const updated = subscribedRivers.filter(r => r !== river);
      setSubscribedRivers(updated);
    }
  };

  // Content for About, Help, and Privacy Policy
  const contentData = {
    about: {
      title: 'About Montana Fishing Reports',
      content: [
        { heading: 'Version', text: '2.0.41' },
        { heading: 'Our Mission', text: 'Built with ❤️ in Montana\n\nMontana Fishing Reports is dedicated to providing the most up-to-date fishing information for Montana\'s world-class rivers and streams. We combine real-time data, expert guide reports, and AI-powered predictions to help you have your best day on the water.' },
        { heading: 'Features', text: '• Real-time USGS flow data\n• Weather conditions and forecasts\n• Guide fishing reports\n• AI-powered HatchCast predictions\n• Interactive access point maps\n• Personal fishing log (Premium)\n• Community leaderboard (Premium)\n• Push notification alerts (Premium)' },
        { heading: 'Data Sources', text: '• USGS - Water flow and temperature data\n• NOAA - Weather forecasts and alerts\n• Local Guides - Fishing reports and expertise\n• AI Models - Hatch predictions and recommendations\n• Community - Catch reports and river conditions' },
        { heading: 'Rivers Covered', text: 'Over 30 Montana rivers including:\n• Yellowstone River\n• Madison River (Upper & Lower)\n• Missouri River\n• Gallatin River\n• Bighorn River\n• Beaverhead River\n• Bitterroot River\n• Blackfoot River\n• And many more...' },
        { heading: 'Premium Subscription', text: 'Upgrade to Premium for advanced features:\n• The HatchCast - AI-powered hatch predictions\n• 7-day flow forecasts\n• Personal fishing log with photos\n• River Mile Calculator\n• Leaderboard competitions\n• Push notifications for hatches and flows\n• Unlimited favorites\n• Ad-free experience' },
        { heading: 'Credits', text: 'River images courtesy of local photographers and guides.\n\nSpecial thanks to:\n• The Montana fishing community\n• Local fly shops and guides\n• USGS and NOAA for data\n• Our Premium subscribers for their support' },
        { heading: 'Legal', text: '© 2026 Montana Fishing Reports\nAll rights reserved.\n\nMontana Fishing Reports is not responsible for fishing conditions or access changes. Always check local regulations and landowner permissions before fishing.' },
      ]
    },
    help: {
      title: 'Help & Support',
      content: [
        { heading: 'Getting Started', text: 'Browse rivers by region tabs or use the search bar. Tap any river card to view detailed conditions, fishing reports, hatches, and access points. Use the Map tab to see rivers and access points near you.' },
        { heading: 'Navigation', text: '• Rivers Tab: Browse all rivers with conditions and reports\n• Map Tab: Interactive map with river locations and access points\n• Favorites Tab: Your saved rivers (2 for free, unlimited for Premium)\n• Leaderboard Tab: Compare catches with other anglers (Premium)\n• Premium Tab: Manage subscription and features' },
        { heading: 'Favorites', text: 'Tap the heart icon on any river card or detail page to save it. Free users can save up to 2 rivers. Premium users get unlimited favorites and can access them offline.' },
        { heading: 'Free vs Premium', text: 'FREE:\n• River conditions and reports\n• Basic maps (no personal pins)\n• 2 favorites\n• Shop fishing reports\n\nPREMIUM:\n• The HatchCast (AI predictions)\n• Fly recommendations\n• 7-Day flow forecast\n• River Mile Calculator\n• Personal Fishing Log\n• Leaderboard\n• Push notifications\n• Unlimited favorites\n• Personal pins on map\n• Ad-free experience' },
        { heading: 'Fishing Log', text: 'Premium feature to log your catches with:\n• Photos and details\n• Location (GPS or manual)\n• Fish species, size, weight\n• Flies used and techniques\n• Weather and flow conditions\n• Share via Brag Cards' },
        { heading: 'Notifications (Premium)', text: 'Enable in Settings → Notifications for:\n• Daily Briefing - Morning fishing summary\n• Hatch Alerts - When major hatches are reported\n• Flow Alerts - Significant water level changes\n• New Reports - When guides post updates' },
        { heading: 'Brag Cards', text: 'Share your catches! Create a shareable image from your fishing log entries to post on social media. Tap the share icon on any log entry.' },
        { heading: 'Offline Mode', text: 'The app caches river data automatically. Cached data shows when you\'re offline and refreshes when you reconnect. Premium users can also access favorites offline.' },
        { heading: 'Seasonal Rivers', text: 'Some rivers (like Beaverhead) show "Seasonal" for flow when USGS gauges are offline during winter months. This is normal and flow data will return when gauges are active.' },
        { heading: 'Contact Us', text: 'Email: Dhaul12@protonmail.com\n\nWe typically respond within 24-48 hours.\n\nFor bug reports, include:\n• App version (Settings → About)\n• Device type\n• What you were doing when the issue occurred' },
        { heading: 'Troubleshooting', text: 'App not loading:\n• Force close and restart\n• Check internet connection\n• Update to latest app version\n\nNotifications not working:\n• Check Settings → Notifications\n• Ensure Premium is active\n• Restart device after enabling\n\nLocation not showing:\n• Check device location permissions\n• Enable "Precise Location" for best results' },
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      content: [
        { heading: 'Effective Date', text: 'March 21, 2026' },
        { heading: 'Introduction', text: 'Montana Fishing Reports is committed to protecting your privacy. This Privacy Policy explains how we collect, use, store, and protect your information when you use our mobile application.' },
        { heading: 'Account & Subscription', text: 'We collect subscription information through RevenueCat (our payment processor). We do not store your payment card details. A device identifier is collected to manage free usage limits and synchronize your Premium status across app reinstalls.' },
        { heading: 'Location Data', text: 'With your permission, we collect your precise location to:\n• Show your position on the map\n• Display nearby fishing rivers and access points\n• Calculate distances to river access points\n• Tag catch locations in your Fishing Log\n\nYou can disable location access at any time through your device settings.' },
        { heading: 'Camera & Photos', text: 'With your permission, we access your camera to take photos of catches for your Fishing Log. We also access your photo library to select existing photos. All photos are stored locally on your device unless you choose to share them via Brag Cards or social media.' },
        { heading: 'User Content', text: 'Fishing Log data (photos, catch details, notes, fish type, size, weight, flies used) is stored locally on your device unless you choose to share it. Favorites are stored locally and synced with your device identifier.' },
        { heading: 'Social Sharing', text: 'When using Brag Card or social sharing features, you control what content is shared. We do not post to social media on your behalf. Sharing to Instagram, Facebook, Twitter, etc. is handled by those platforms\' respective apps and subject to their privacy policies. Images created for sharing are generated locally on your device.' },
        { heading: 'Push Notifications', text: 'If enabled (Premium feature), we collect:\n• Your push notification token\n• Subscribed rivers for alerts\n• Alert preferences (hatch alerts, flow alerts, daily briefing)\n\nYou can manage or disable notifications anytime in Settings → Notifications.' },
        { heading: 'Analytics & Diagnostics', text: 'We collect anonymous data about which rivers and features are viewed, app performance, and load times. We collect crash reports and error logs to fix bugs and improve stability. Free users see ads served by Google Mobile Ads.' },
        { heading: 'Information We Do NOT Collect', text: 'We do NOT collect:\n• Name, email address, or contact information (unless you contact us for support)\n• Phone number or physical address\n• Contacts from your phone\n• Browsing or search history\n• Financial information (handled by Apple/Google)\n• Precise location history (only stored when you explicitly tag a catch)\n• Social media login credentials' },
        { heading: 'Third-Party Services', text: 'We use the following third-party services:\n\nRevenueCat\n• Purpose: Subscription management\n• Data: Anonymous user ID, purchase history\n\nGoogle Mobile Ads\n• Purpose: Display advertisements (free users only)\n• Data: Device ID, advertising ID, ad interactions\n\nGoogle Analytics\n• Purpose: Usage analytics\n• Data: Anonymous usage data\n\nExpo\n• Purpose: App platform, crash reporting\n• Data: Anonymous usage data, crash logs\n\nUSGS\n• Purpose: River flow and temperature data\n• Data: No personal data shared\n\nNOAA/Open-Meteo\n• Purpose: Weather data\n• Data: Location coordinates (for lookup only)' },
        { heading: 'Data Storage & Security', text: 'Local Storage: Most data (fishing logs, favorites, cached river data, Brag Cards) is stored locally on your device.\n\nCloud Storage: Subscription status and notification preferences are stored securely in the cloud.\n\nEncryption: All data transmitted between the app and our servers uses HTTPS encryption.\n\nNo Sale: We do not sell your personal data to third parties.\n\nData Retention: We retain usage analytics for 12 months, then anonymize or delete.' },
        { heading: 'Permissions Required', text: 'Location (When In Use)\n• Purpose: Show your position on map, tag catch locations\n• Optional: Yes\n\nCamera\n• Purpose: Take photos of catches for your fishing log\n• Optional: Yes\n\nPhoto Library\n• Purpose: Select existing photos for fishing log\n• Optional: Yes\n\nPush Notifications\n• Purpose: River flow alerts and hatch notifications (Premium)\n• Optional: Yes' },
        { heading: 'Your Rights & Choices', text: 'Location Access: Disable anytime in device Settings → Montana Fishing Reports → Location\n\nNotifications: Manage in-app: Settings → Notifications, or in device Settings → Notifications → Montana Fishing Reports\n\nData Export: Premium users can export fishing log data through the app (feature available in Settings)\n\nData Deletion: To request deletion of your account data, email Dhaul12@protonmail.com with your device ID (found in Settings → About). We process requests within 30 days.\n\nAdvertising Opt-Out: Free users can limit ad tracking in device Settings → Privacy → Tracking. Upgrade to Premium to remove all ads.' },
        { heading: 'Children\'s Privacy', text: 'Montana Fishing Reports is not intended for children under 13. We do not knowingly collect data from children under 13. If you believe we have collected data from a child under 13, please contact us immediately.' },
        { heading: 'Changes to This Policy', text: 'We may update this Privacy Policy as we add new features. Changes will be posted in the app (Settings → Privacy Policy), updated with a new effective date, and notified via in-app message for significant changes.' },
        { heading: 'Compliance', text: 'This app complies with:\n• Apple App Store Privacy Guidelines\n• Google Play Store Privacy Policy Requirements\n• General Data Protection Regulation (GDPR) for EU users\n• California Consumer Privacy Act (CCPA) for California users' },
        { heading: 'Contact', text: 'For privacy-related questions, data requests, or concerns:\n\nMontana Fishing Reports\nEmail: Dhaul12@protonmail.com\nResponse Time: Within 48 hours' },
      ]
    }
  };

  const openModal = (key) => {
    const data = contentData[key];
    if (data) {
      setModalTitle(data.title);
      setModalContent(data.content);
      setModalVisible(true);
    }
  };

  const renderSettingItem = ({ icon, title, subtitle, value, onValueChange, type = 'toggle', onPress }) => (
    <TouchableOpacity 
      style={styles.settingItem}
      onPress={onPress}
      disabled={type !== 'link'}
    >
      <View style={styles.settingIconContainer}>
        {icon}
      </View>
      <View style={styles.settingContent}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {type === 'toggle' && (
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#e8e4da', true: COLORS.accent }}
          thumbColor={'#ffffff'}
        />
      )}
      {type === 'link' && (
        <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#f5f1e8" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Notifications Section - Premium Feature */}
        <View style={styles.section}>
          <View style={styles.smartSectionHeader}>
            <MaterialCommunityIcons name="bell-outline" size={20} color={COLORS.accent} />
            <Text style={styles.smartSectionTitle}>Notifications</Text>
            {!isPremium && (
              <View style={styles.premiumBadge}>
                <MaterialIcons name="diamond" size={12} color={COLORS.accent} />
                <Text style={styles.premiumBadgeText}>PREMIUM</Text>
              </View>
            )}
          </View>
          
          {!isPremium ? (
            // Free user - show upsell
            <TouchableOpacity 
              style={styles.upsellItem}
              onPress={() => Alert.alert(
                '🔒 Premium Feature',
                'Get instant push notifications when new fishing reports are posted, daily briefings, and hatch alerts. Upgrade to Premium to unlock!',
                [
                  { text: 'Not Now', style: 'cancel' },
                  { 
                    text: 'Upgrade to Premium', 
                    style: 'default',
                    onPress: () => navigation.navigate('MainTabs', { screen: 'Premium' })
                  }
                ]
              )}
            >
              <View style={styles.settingIconContainer}>
                <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textMuted} />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, { color: COLORS.textMuted }]}>Enable Notifications</Text>
                <Text style={styles.settingSubtitle}>Upgrade to Premium for fishing alerts</Text>
              </View>
              <MaterialIcons name="lock" size={18} color={COLORS.accent} />
            </TouchableOpacity>
          ) : (
            // Premium user - show controls
            <>
              {renderSettingItem({
                icon: <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.primary} />,
                title: 'Enable Notifications',
                subtitle: 'Master toggle for all notifications',
                value: notificationsEnabled,
                onValueChange: toggleNotifications,
              })}

              {notificationsEnabled && (
                <>
                  {renderSettingItem({
                    icon: <MaterialCommunityIcons name="weather-sunset" size={22} color={COLORS.primary} />,
                    title: 'Daily Briefing',
                    subtitle: 'Morning fishing report summary',
                    value: dailyBriefing,
                    onValueChange: (val) => { setDailyBriefing(val); saveSettings('dailyBriefing', val); },
                  })}

                  {renderSettingItem({
                    icon: <MaterialCommunityIcons name="bug" size={22} color={COLORS.primary} />,
                    title: 'Hatch Alerts',
                    subtitle: 'Major hatch notifications',
                    value: hatchAlerts,
                    onValueChange: (val) => { setHatchAlerts(val); saveSettings('hatchAlerts', val); },
                  })}
                </>
              )}
            </>
          )}
        </View>

        {/* Smart Notifications - Premium Only */}
        {isPremium && notificationsEnabled && (
          <View style={styles.section}>
            {renderSettingItem({
              icon: <MaterialCommunityIcons name="radar" size={22} color={COLORS.primary} />,
              title: 'HatchCast Score Alerts',
              subtitle: `Notify when score exceeds ${scoreThreshold}`,
              value: scoreAlertsEnabled,
              onValueChange: (val) => { setScoreAlertsEnabled(val); saveSettings('scoreAlertsEnabled', val); },
            })}
            
            {scoreAlertsEnabled && (
              <View style={styles.thresholdContainer}>
                <Text style={styles.thresholdLabel}>Alert Threshold</Text>
                <Stepper
                  value={parseInt(scoreThreshold) || 85}
                  min={50}
                  max={100}
                  step={5}
                  onChange={(val) => { setScoreThreshold(val); saveSettings('scoreThreshold', val); }}
                />
              </View>
            )}

            {renderSettingItem({
              icon: <MaterialCommunityIcons name="waves" size={22} color={COLORS.primary} />,
              title: 'Flow Spike Warnings',
              subtitle: `Alert on ${flowSpikeThreshold}+ CFS change`,
              value: flowSpikeAlertsEnabled,
              onValueChange: (val) => { setFlowSpikeAlertsEnabled(val); saveSettings('flowSpikeAlertsEnabled', val); },
            })}
            
            {flowSpikeAlertsEnabled && (
              <>
                <View style={styles.thresholdContainer}>
                  <Text style={styles.thresholdLabel}>Minimum Change (CFS)</Text>
                  <Stepper
                    value={parseInt(flowSpikeThreshold) || 300}
                    min={100}
                    max={1000}
                    step={50}
                    onChange={(val) => { setFlowSpikeThreshold(val); saveSettings('flowSpikeThreshold', val); }}
                  />
                </View>
                
                {renderSettingItem({
                  icon: <MaterialCommunityIcons name="alert-circle" size={22} color={COLORS.error} />,
                  title: 'Dangerous Flow Warnings',
                  subtitle: 'High water safety alerts',
                  value: dangerousFlowAlerts,
                  onValueChange: (val) => { setDangerousFlowAlerts(val); saveSettings('dangerousFlowAlerts', val); },
                })}
              </>
            )}

            {renderSettingItem({
              icon: <MaterialCommunityIcons name="weather-partly-cloudy" size={22} color={COLORS.primary} />,
              title: 'Weather Alerts',
              subtitle: 'Optimal fishing conditions',
              value: weatherAlertsEnabled,
              onValueChange: (val) => { setWeatherAlertsEnabled(val); saveSettings('weatherAlertsEnabled', val); },
            })}
            
            {weatherAlertsEnabled && (
              <>
                {renderSettingItem({
                  icon: <MaterialCommunityIcons name="weather-windy" size={22} color={COLORS.primary} />,
                  title: 'Wind Alerts',
                  subtitle: 'Wind dropping to ideal levels',
                  value: windAlerts,
                  onValueChange: (val) => { setWindAlerts(val); saveSettings('windAlerts', val); },
                })}
                {renderSettingItem({
                  icon: <MaterialCommunityIcons name="thermometer" size={22} color={COLORS.primary} />,
                  title: 'Temperature Alerts',
                  subtitle: 'Optimal water temps',
                  value: tempAlerts,
                  onValueChange: (val) => { setTempAlerts(val); saveSettings('tempAlerts', val); },
                })}
              </>
            )}

            {renderSettingItem({
              icon: <MaterialCommunityIcons name="moon-waning-crescent" size={22} color={COLORS.primary} />,
              title: 'Solunar Feeding Times',
              subtitle: 'Peak feeding period reminders',
              value: solunarAlertsEnabled,
              onValueChange: (val) => { setSolunarAlertsEnabled(val); saveSettings('solunarAlertsEnabled', val); },
            })}
            
            {solunarAlertsEnabled && (
              <View style={styles.thresholdContainer}>
                <Text style={styles.thresholdLabel}>Reminder (minutes before)</Text>
                <Stepper
                  value={parseInt(solunarReminderMinutes) || 30}
                  min={15}
                  max={60}
                  step={15}
                  onChange={(val) => { setSolunarReminderMinutes(val); saveSettings('solunarReminderMinutes', val); }}
                />
              </View>
            )}
          </View>
        )}

        {/* Subscribed Rivers Section - Premium Only */}
        {isPremium && notificationsEnabled && subscribedRivers.length > 0 && (
          <View style={styles.section}>
            <View style={styles.smartSectionHeader}>
              <MaterialCommunityIcons name="waves" size={20} color={COLORS.accent} />
              <Text style={styles.smartSectionTitle}>Subscribed Rivers</Text>
            </View>
            {subscribedRivers.map(river => (
              <View key={river} style={styles.riverItem}>
                <View style={styles.riverInfo}>
                  <MaterialCommunityIcons name="waves" size={18} color={COLORS.primary} />
                  <Text style={styles.riverName}>{river}</Text>
                </View>
                <TouchableOpacity 
                  style={styles.unsubscribeButton}
                  onPress={() => unsubscribeFromRiver(river)}
                >
                  <Text style={styles.unsubscribeText}>Unsubscribe</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* App Info Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('about')}>
            <View style={styles.settingIconContainer}>
              <MaterialIcons name="info-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>About</Text>
              <Text style={styles.settingSubtitle}>Version 2.0.41</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('privacy')}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="file-document-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingItem} onPress={() => openModal('help')}>
            <View style={styles.settingIconContainer}>
              <MaterialCommunityIcons name="help-circle-outline" size={22} color={COLORS.primary} />
            </View>
            <View style={styles.settingContent}>
              <Text style={styles.settingTitle}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Content Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <Ionicons name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {modalContent && modalContent.map((item, index) => (
                <View key={index} style={styles.modalSection}>
                  <Text style={styles.modalHeading}>{item.heading}</Text>
                  <Text style={styles.modalText}>{item.text}</Text>
                </View>
              ))}
              <View style={styles.bottomPadding} />
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 40,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#f5f1e8',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    backgroundColor: COLORS.surface,
    marginTop: 16,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  premiumBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.accent,
  },
  upsellItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  settingSubtitle: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  riverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  riverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  riverName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  unsubscribeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#fee2e2',
    borderRadius: 6,
  },
  unsubscribeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
  bottomPadding: {
    height: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    minHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  modalCloseButton: {
    padding: 4,
  },
  modalScroll: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  modalSection: {
    marginBottom: 20,
  },
  modalHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
  },
  thresholdContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 12,
  },
  thresholdLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  smartSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 12,
    gap: 10,
  },
  smartSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    letterSpacing: 0.3,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  stepperButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  stepperValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 60,
    textAlign: 'center',
  },
  thresholdLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  thresholdMin: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  thresholdMax: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default SettingsScreen;
