import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const CARD_MARGIN = 12;
const CARD_WIDTH = width - (CARD_MARGIN * 2);

const COLORS = {
  primary: '#2d4a3e',
  accent: '#c9a227',
  text: '#2c2416',
  textSecondary: '#6b5d4d',
  textLight: '#9a8b7a',
  textMuted: '#9a8b7a',
  surface: '#faf8f3',
  background: '#f5f1e8',
  border: '#e8e4da',
};

const LiveAnglerReportsCard = ({ reports, count, onSubmitReport, riverName }) => {
  const displayReports = reports.slice(0, 3);
  const hasMore = count > 3;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="account-group" size={22} color={COLORS.primary} />
          <View style={styles.headerText}>
            <Text style={styles.title}>Live Angler Reports</Text>
            <Text style={styles.subtitle}>
              {count > 0 ? `${count} reports from fellow anglers` : 'Be the first to share conditions'}
            </Text>
          </View>
        </View>
        {count > 0 && (
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        )}
      </View>

      {count > 0 ? (
        <>
          <View style={styles.reportsList}>
            {displayReports.map((report, index) => (
              <View 
                key={index} 
                style={[
                  styles.reportItem,
                  index === 0 && styles.reportItemFirst,
                  index === displayReports.length - 1 && styles.reportItemLast,
                ]}
              >
                <View style={styles.reportHeader}>
                  <Text style={styles.reportDate}>
                    {new Date(report.created_at).toLocaleDateString()}
                  </Text>
                  {report.fish_caught > 0 && (
                    <View style={styles.fishBadge}>
                      <Text style={styles.fishText}>🎣 {report.fish_caught}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.tagsRow}>
                  {report.fish_activity && (
                    <View style={[styles.tag, styles.tagPrimary]}>
                      <Text style={styles.tagText}>{report.fish_activity}</Text>
                    </View>
                  )}
                  {report.fish_caught > 0 && (
                    <View style={[styles.tag, styles.tagSuccess]}>
                      <Text style={styles.tagText}>🎣 {report.fish_caught}</Text>
                    </View>
                  )}
                  {report.water_color && (
                    <View style={styles.tag}>
                      <Text style={styles.tagText}>{report.water_color}</Text>
                    </View>
                  )}
                  {report.fish_rising && (
                    <View style={[styles.tag, styles.tagInfo]}>
                      <Text style={styles.tagText}>↗️ rising</Text>
                    </View>
                  )}
                  {report.fly_hook_size && (
                    <View style={[styles.tag, styles.tagAccent]}>
                      <Text style={styles.tagText}>#{report.fly_hook_size}</Text>
                    </View>
                  )}
                </View>
                
                {/* NEW: Crowd & pressure info */}
                {(report.crowd_level || report.boat_activity) && (
                  <View style={styles.crowdRow}>
                    {report.crowd_level && (
                      <View style={styles.crowdItem}>
                        <MaterialCommunityIcons name="account-group" size={12} color={COLORS.textMuted} />
                        <Text style={styles.crowdText}>{report.crowd_level}</Text>
                      </View>
                    )}
                    {report.boat_activity && report.boat_activity !== 'none' && (
                      <View style={styles.crowdItem}>
                        <MaterialCommunityIcons name="sail-boat" size={12} color={COLORS.textMuted} />
                        <Text style={styles.crowdText}>{report.boat_activity}</Text>
                      </View>
                    )}
                  </View>
                )}

                {report.notes && (
                  <Text style={styles.notes} numberOfLines={2}>
                    {report.notes}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.actionButton} onPress={onSubmitReport}>
            <Ionicons name="add-circle" size={18} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>
              {hasMore ? `View all ${count} reports or submit yours` : 'Submit Your Report'}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textMuted} />
          <Text style={styles.emptyTitle}>No reports yet today</Text>
          <Text style={styles.emptySubtitle}>Be the first to share current conditions</Text>
          <TouchableOpacity style={styles.submitButton} onPress={onSubmitReport}>
            <Ionicons name="add" size={20} color="#2c2416" />
            <Text style={styles.submitButtonText}>Submit River Report</Text>
          </TouchableOpacity>
        </View>
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
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    marginLeft: 8,
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
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
  reportDate: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  fishBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  fishText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#2c2416',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tagPrimary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tagSuccess: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  tagInfo: {
    backgroundColor: '#3498db',
    borderColor: '#3498db',
  },
  tagAccent: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  crowdRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  crowdItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crowdText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  notes: {
    fontSize: 13,
    color: COLORS.text,
    marginTop: 8,
    fontStyle: 'italic',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 16,
    gap: 6,
  },
  submitButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2c2416',
  },
});

export default LiveAnglerReportsCard;
