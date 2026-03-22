import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
  text: '#2c2416',
  textLight: '#6b5d4d',
  textMuted: '#9a8b7a',
  good: '#5a7d5a',
  fair: '#d4a574',
  poor: '#a65d57',
};

const SOURCE_ICONS = {
  'Trouts Fly Fishing': '🎣',
  'The River\'s Edge': '🏪',
  'Montana Angler': '🎯',
  'Yellow Dog Flyfishing': '🐕',
  'Madison River Fishing': '🌊',
  'Fins & Feathers': '🪶',
  'Big Hole Lodge': '🏔️',
  'Missouri River Outfitters': '🚣',
  'Gallatin River Guides': '📍',
  'Lone Mountain Ranch': '🏕️',
  'Bighorn River Lodge': '🏞️',
  'Beartooth Flyfishing': '🐻',
  'Sweetwater Fly Shop': '🍯',
  'Shuttle\'s Mind': '🚐',
  'Simms Fishing': '👖',
  'Rio Products': '🎣',
  'default': '📰'
};

const getSourceIcon = (source) => {
  if (!source) return SOURCE_ICONS['default'];
  return SOURCE_ICONS[source] || SOURCE_ICONS['default'];
};

const ReportItem = ({ report, isFirst, isLast }) => {
  const [expanded, setExpanded] = useState(false);
  const [iconError, setIconError] = useState(false);

  // Guard against undefined report - just need URL to link to
  if (!report || !report.source) {
    return null;
  }

  // Note: We don't show ANY report text due to copyright concerns
  // Users click to read full report on the shop's original website

  const handlePress = () => {
    if (report.url) {
      Linking.openURL(report.url);
    } else {
      setExpanded(!expanded);
    }
  };

  // Get date from API fields (last_updated_text or last_updated)
  const reportDate = report.last_updated_text || report.last_updated || report.relative_time;
  
  // Get favicon URL
  const faviconUrl = report.icon_url;

  return (
    <TouchableOpacity 
      style={[
        styles.reportItem,
        isFirst && styles.reportItemFirst,
        isLast && styles.reportItemLast,
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.reportHeader}>
        <View style={styles.sourceRow}>
          {faviconUrl && !iconError ? (
            <Image 
              source={{ uri: faviconUrl }} 
              style={styles.faviconImage}
              resizeMode="contain"
              onError={() => setIconError(true)}
            />
          ) : (
            <Text style={styles.sourceIcon}>{getSourceIcon(report.source)}</Text>
          )}
          <Text style={styles.sourceName} numberOfLines={1}>{report.source}</Text>
        </View>
        {reportDate && (
          <Text style={styles.reportDate}>{reportDate}</Text>
        )}
      </View>

      {report.url && (
        <TouchableOpacity style={styles.readMoreRow} onPress={handlePress}>
          <Text style={styles.readMoreText}>View Full Report on {report.source}'s Website</Text>
          <MaterialIcons name="open-in-new" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

const RiverReportsCard = ({ reports }) => {
  const [expanded, setExpanded] = useState(false);

  // Filter out invalid reports - just need source name
  const validReports = (reports || []).filter(r => r && r.source);

  if (validReports.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="newspaper" size={22} color={COLORS.primary} />
          <Text style={styles.title}>Fly Shop Reports</Text>
        </View>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="text-box-search-outline" size={32} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>No recent reports available</Text>
          <Text style={styles.emptySubtext}>Check back soon for updates from local fly shops</Text>
        </View>
      </View>
    );
  }

  const displayReports = expanded ? validReports : validReports.slice(0, 2);
  const hasMore = validReports.length > 2;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="newspaper" size={22} color={COLORS.primary} />
        <Text style={styles.title}>Fly Shop Reports</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{validReports.length}</Text>
        </View>
      </View>

      <View style={styles.reportsList}>
        {displayReports.map((report, index) => (
          <ReportItem 
            key={report.id || index}
            report={report}
            isFirst={index === 0}
            isLast={!hasMore || (index === displayReports.length - 1 && !hasMore) || (expanded && index === displayReports.length - 1)}
          />
        ))}
      </View>

      {hasMore && (
        <TouchableOpacity 
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Show Less' : `View ${validReports.length - 2} More Reports`}
          </Text>
          <MaterialIcons 
            name={expanded ? "expand-less" : "expand-more"} 
            size={20} 
            color={COLORS.primary} 
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    width: CARD_WIDTH,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginLeft: 8,
    flex: 1,
  },
  countBadge: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  countText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textLight,
  },
  reportsList: {
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  reportItem: {
    backgroundColor: COLORS.background,
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  reportItemFirst: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  reportItemLast: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    borderBottomWidth: 0,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  sourceIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  faviconImage: {
    width: 20,
    height: 20,
    marginRight: 8,
    borderRadius: 4,
  },
  sourceName: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
  },
  reportDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  reportText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 10,
  },
  conditionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  conditionBadge: {
    backgroundColor: 'rgba(45, 74, 62, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  hatchBadge: {
    backgroundColor: 'rgba(90, 125, 90, 0.12)',
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '600',
  },
  readMoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
    alignSelf: 'flex-start',
  },
  readMoreText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: COLORS.background,
    borderRadius: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textLight,
    marginTop: 10,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
});

export default RiverReportsCard;
