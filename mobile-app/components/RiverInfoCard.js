import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { RIVER_INFO } from '../data/riverInfo';

const COLORS = {
  primary: '#2d4a3e',
  primaryLight: '#4a6b5c',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  surface: '#faf8f3',
  background: '#f5f1e8',
  success: '#5a7d5a',
  warning: '#d4a574',
  danger: '#a65d57',
  info: '#4a90d9'
};

const DIFFICULTY_COLORS = {
  'Beginner': '#5a9e6e',
  'Beginner to Intermediate': '#7cb342',
  'Intermediate': '#c9a227',
  'Intermediate to Advanced': '#d4a574',
  'Advanced': '#a65d57'
};

const RiverInfoCard = ({ riverName }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  
  // Debug logging
  console.log('[RiverInfoCard] Rendering for:', riverName);
  console.log('[RiverInfoCard] Available rivers:', Object.keys(RIVER_INFO).slice(0, 5));
  
  const info = RIVER_INFO[riverName];
  
  console.log('[RiverInfoCard] Found info:', !!info);
  
  if (!info) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>River Information</Text>
        <Text style={styles.noDataText}>No data for "{riverName}". Available: {Object.keys(RIVER_INFO).slice(0, 5).join(', ')}...</Text>
      </View>
    );
  }

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Component to render shuttle list with clickable phone numbers
  const ShuttleList = ({ shuttleText }) => {
    // Parse shuttle text into individual entries
    const lines = shuttleText.split('\n').filter(line => line.trim());
    
    return (
      <View>
        {lines.map((line, index) => {
          // Match pattern: "• Service Name: phone numbers"
          const match = line.match(/^\s*•\s*(.+?):\s*(.+)$/);
          if (!match) return <Text key={index} style={styles.infoText}>{line}</Text>;
          
          const [, serviceName, phoneNumbers] = match;
          
          // Split multiple phone numbers (separated by / or &)
          const phones = phoneNumbers.split(/\s*\/\s*|\s*&\s*|\s+or\s+/i);
          
          return (
            <View key={index} style={styles.shuttleItem}>
              <Text style={styles.shuttleName}>• {serviceName}</Text>
              <View style={styles.phoneNumbers}>
                {phones.map((phone, phoneIndex) => {
                  const cleanPhone = phone.trim();
                  // Extract digits for tel: link
                  const digits = cleanPhone.replace(/\D/g, '');
                  if (digits.length >= 10) {
                    return (
                      <TouchableOpacity 
                        key={phoneIndex}
                        onPress={() => Linking.openURL(`tel:${digits}`)}
                        style={styles.phoneButton}
                      >
                        <Ionicons name="call" size={14} color={COLORS.success} />
                        <Text style={styles.phoneNumber}>{cleanPhone}</Text>
                      </TouchableOpacity>
                    );
                  }
                  return <Text key={phoneIndex} style={styles.phoneNumberPlain}>{cleanPhone}</Text>;
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const SectionHeader = ({ title, icon, section, badge }) => (
    <TouchableOpacity 
      style={styles.sectionHeader}
      onPress={() => toggleSection(section)}
    >
      <View style={styles.sectionTitleRow}>
        <Ionicons name={icon} size={20} color={COLORS.accent} />
        <Text style={styles.sectionTitle}>{title}</Text>
        {badge && (
          <View style={[styles.badge, { backgroundColor: badge.color || COLORS.accent }]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
        )}
      </View>
      <Ionicons 
        name={expandedSection === section ? 'chevron-up' : 'chevron-down'} 
        size={20} 
        color={COLORS.textSecondary} 
      />
    </TouchableOpacity>
  );

  const InfoRow = ({ icon, label, value, color }) => (
    <View style={styles.infoRow}>
      <Ionicons name={icon} size={16} color={color || COLORS.textSecondary} />
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, color && { color }]}>{value}</Text>
    </View>
  );

  const TagList = ({ items, bgColor, textColor }) => (
    <View style={styles.tagContainer}>
      {items.map((item, index) => (
        <View key={index} style={[styles.tag, { backgroundColor: bgColor || COLORS.primary + '15' }]}>
          <Text style={[styles.tagText, { color: textColor || COLORS.primary }]}>{item}</Text>
        </View>
      ))}
    </View>
  );

  const difficultyColor = DIFFICULTY_COLORS[info.difficulty] || COLORS.textSecondary;

  return (
    <View style={styles.container}>
      {/* Header with Overview */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="waves" size={24} color={COLORS.accent} />
        <Text style={styles.title}>River Overview</Text>
      </View>

      <Text style={styles.description}>{info.description}</Text>

      {/* Quick Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <MaterialCommunityIcons name="signal-cellular-2" size={24} color={difficultyColor} />
          <Text style={[styles.statLabel, { color: difficultyColor }]}>{info.difficulty}</Text>
          <Text style={styles.statSubtext}>Difficulty</Text>
        </View>
        
        {info.fishPerMile && (
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="fish" size={24} color={COLORS.success} />
            <Text style={styles.statValue}>{info.fishPerMile.toLocaleString()}</Text>
            <Text style={styles.statSubtext}>Fish/Mile</Text>
          </View>
        )}
        
        {info.averageFishSize && (
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="ruler" size={24} color={COLORS.info} />
            <Text style={styles.statValue}>{info.averageFishSize}</Text>
            <Text style={styles.statSubtext}>Avg Size</Text>
          </View>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Best Seasons */}
        <SectionHeader 
          title="Best Seasons" 
          icon="calendar" 
          section="seasons"
        />
        {expandedSection === 'seasons' && (
          <View style={styles.sectionContent}>
            <TagList items={info.bestSeasons} bgColor={COLORS.success + '20'} textColor={COLORS.success} />
          </View>
        )}

        {/* Species */}
        <SectionHeader 
          title="Fish Species" 
          icon="fish" 
          section="species"
        />
        {expandedSection === 'species' && (
          <View style={styles.sectionContent}>
            <TagList items={info.species} bgColor={COLORS.info + '20'} textColor={COLORS.info} />
          </View>
        )}

        {/* Peak Hatches */}
        <SectionHeader 
          title="Peak Hatches" 
          icon="bug" 
          section="hatches"
        />
        {expandedSection === 'hatches' && (
          <View style={styles.sectionContent}>
            <TagList items={info.peakHatches} bgColor={COLORS.accent + '20'} textColor={COLORS.primary} />
          </View>
        )}

        {/* Techniques */}
        <SectionHeader 
          title="Fishing Techniques" 
          icon="hand-left" 
          section="techniques"
        />
        {expandedSection === 'techniques' && (
          <View style={styles.sectionContent}>
            {info.techniques.map((technique, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.bulletText}>{technique}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Wading Info */}
        <SectionHeader 
          title="Wading Information" 
          icon="footsteps" 
          section="wading"
        />
        {expandedSection === 'wading' && (
          <View style={styles.sectionContent}>
            <InfoRow 
              icon="warning" 
              label="Difficulty" 
              value={info.wading}
              color={info.wading.includes('Difficult') ? COLORS.danger : COLORS.success}
            />
            <Text style={styles.notesText}>{info.wadingNotes}</Text>
          </View>
        )}

        {/* Access Points */}
        <SectionHeader 
          title="Access Points" 
          icon="map" 
          section="access"
        />
        {expandedSection === 'access' && (
          <View style={styles.sectionContent}>
            {info.accessPoints.map((point, index) => (
              <View key={index} style={styles.bulletItem}>
                <Ionicons name="location" size={14} color={COLORS.accent} />
                <Text style={styles.bulletText}>{point}</Text>
              </View>
            ))}
            <Text style={styles.notesText}>{info.accessTips}</Text>
          </View>
        )}

        {/* Flow Conditions */}
        <SectionHeader 
          title="Flow Conditions" 
          icon="water" 
          section="flows"
        />
        {expandedSection === 'flows' && (
          <View style={styles.sectionContent}>
            <InfoRow icon="checkmark-circle" label="Optimal" value={info.flows.optimal} color={COLORS.success} />
            <InfoRow icon="alert-circle" label="Too Low" value={info.flows.tooLow} color={COLORS.warning} />
            <InfoRow icon="close-circle" label="Too High" value={info.flows.tooHigh} color={COLORS.danger} />
          </View>
        )}

        {/* Local Tips */}
        <SectionHeader 
          title="Local Tips" 
          icon="bulb" 
          section="tips"
        />
        {expandedSection === 'tips' && (
          <View style={styles.sectionContent}>
            {info.localTips.map((tip, index) => (
              <View key={index} style={styles.tipItem}>
                <View style={styles.tipNumber}>
                  <Text style={styles.tipNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Nearby Services */}
        <SectionHeader 
          title="Fly Shops & Services" 
          icon="storefront" 
          section="services"
        />
        {expandedSection === 'services' && (
          <View style={styles.sectionContent}>
            {info.nearbyServices.map((service, index) => (
              <View key={index} style={styles.serviceItem}>
                <Ionicons name="business" size={16} color={COLORS.primary} />
                <Text style={styles.serviceText}>{service}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Hazards */}
        <SectionHeader 
          title="Safety & Hazards" 
          icon="warning" 
          section="hazards"
          badge={{ text: 'Important', color: COLORS.danger }}
        />
        {expandedSection === 'hazards' && (
          <View style={styles.sectionContent}>
            {info.hazards.map((hazard, index) => (
              <View key={index} style={styles.hazardItem}>
                <Ionicons name="alert-circle" size={16} color={COLORS.danger} />
                <Text style={styles.hazardText}>{hazard}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Shuttles - Only shown for rivers with shuttle services */}
        {info.shuttles && (
          <>
            <SectionHeader 
              title="Book a Shuttle" 
              icon="car" 
              section="shuttles"
            />
            {expandedSection === 'shuttles' && (
              <View style={styles.sectionContent}>
                <ShuttleList shuttleText={info.shuttles} />
              </View>
            )}
          </>
        )}

        {/* Guiding Services */}
        <SectionHeader 
          title="Book a Guide" 
          icon="people" 
          section="guiding"
          badge={{ text: 'Coming Soon', color: COLORS.accent }}
        />
        {expandedSection === 'guiding' && (
          <View style={styles.sectionContent}>
            <Text style={styles.comingSoonText}>{info.guidingServices}</Text>
          </View>
        )}

        {/* Bottom Spacer */}
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8e4da',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
  },
  noDataText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  statSubtext: {
    fontSize: 11,
    color: COLORS.textLight,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  sectionContent: {
    paddingVertical: 12,
    paddingLeft: 8,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    width: 70,
  },
  infoValue: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
    flex: 1,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  bullet: {
    fontSize: 14,
    color: COLORS.text,
    marginTop: 1,
  },
  bulletText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    lineHeight: 19,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 8,
    marginLeft: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
    gap: 10,
  },
  tipNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumberText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 13,
    color: COLORS.text,
    flex: 1,
    lineHeight: 19,
    marginTop: 2,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  serviceText: {
    fontSize: 13,
    color: COLORS.text,
  },
  hazardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  hazardText: {
    fontSize: 13,
    color: COLORS.danger,
    flex: 1,
  },
  regulationsBox: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  regulationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  regulationsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  regulationsText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 20,
    marginBottom: 8,
  },
  regulationsNote: {
    fontSize: 11,
    color: COLORS.textLight,
    fontStyle: 'italic',
  },
  comingSoonText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 19,
  },
  // Shuttle styles
  shuttleItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0ece0',
  },
  shuttleName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  phoneNumbers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginLeft: 12,
  },
  phoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(90, 125, 90, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(90, 125, 90, 0.3)',
  },
  phoneNumber: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.success,
  },
  phoneNumberPlain: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
});

export default RiverInfoCard;
