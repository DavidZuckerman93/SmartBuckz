import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, SafeAreaView, TouchableOpacity, FlatList, TextInput, Image, ActivityIndicator } from 'react-native';
import { useUser } from '../../context/UserContext';
import { COLORS } from '../../theme/colors';
import { Search, MapPin, Star, Clock, Filter, Navigation, ShieldCheck, User } from 'lucide-react-native';
import GlobalHeader from '../../components/GlobalHeader';
import { sellerService } from '../../services/api';

const SellerDiscoveryScreen = ({ navigation }) => {
  const [sellers, setSellers] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('Proximity');
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 10;

  const fetchSellers = useCallback(async (newOffset = 0, isInitial = false) => {
    if (loading || (loadingMore && !isInitial)) return;

    if (isInitial) {
      setLoading(true);
      setOffset(0);
    } else {
      setLoadingMore(true);
    }

    try {
      const data = await sellerService.getSellers(LIMIT, newOffset, search);
      if (isInitial) {
        setSellers(data);
      } else {
        setSellers(prev => [...prev, ...data]);
      }
      setHasMore(data.length === LIMIT);
      setOffset(newOffset + LIMIT);
    } catch (err) {
      console.error('Error fetching sellers:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, loading, loadingMore]);

  useEffect(() => {
    fetchSellers(0, true);
  }, [search]);

  const handleLoadMore = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchSellers(offset);
    }
  };

  const sortedSellers = [...sellers].sort((a, b) => {
    if (filterType === 'Proximity') return parseFloat(a.distance) - parseFloat(b.distance);
    if (filterType === 'Rating') return b.rating - a.rating;
    if (filterType === 'Availability') return (b.isAvailable === a.isAvailable) ? 0 : b.isAvailable ? 1 : -1;
    return 0;
  });

  const renderSeller = ({ item }) => (
    <TouchableOpacity 
      style={styles.sellerCard}
      onPress={() => navigation.navigate('SellerDetails', { sellerId: item.id })}
    >
      <View style={styles.sellerImageContainer}>
        {item.profile_image ? (
          <Image source={{ uri: item.profile_image }} style={styles.sellerListImage} />
        ) : (
          <View style={styles.sellerIconPlaceholder}>
            <User size={24} color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={styles.sellerInfo}>
        <View style={styles.sellerHeader}>
          <View style={styles.nameRow}>
            <Text style={styles.sellerName}>{item.name}</Text>
            {item.is_verified === 1 && (
              <ShieldCheck size={16} color={COLORS.secondary} fill={COLORS.secondary} />
            )}
          </View>
          <View style={styles.ratingBadge}>
            <Star size={14} color={COLORS.secondary} fill={COLORS.secondary} />
            <Text style={styles.ratingText}>{item.rating}</Text>
          </View>
        </View>
        
        <View style={styles.sellerDetailRow}>
          <MapPin size={14} color={COLORS.darkGray} />
          <Text style={styles.sellerDetailText}>{item.address}</Text>
        </View>

        <View style={styles.sellerFooter}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: item.isAvailable ? COLORS.success : COLORS.danger }]} />
            <Text style={styles.statusText}>{item.isAvailable ? 'Available Now' : 'Currently Closed'}</Text>
          </View>
          <View style={styles.distanceBadge}>
            <Navigation size={14} color={COLORS.primary} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.mapBtn}
        onPress={() => alert(`Opening Google Maps for ${item.name} at ${item.lat}, ${item.lng}`)}
      >
        <Navigation size={20} color={COLORS.white} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <GlobalHeader 
        navigation={navigation} 
        showSearch={true} 
        onSearchChange={setSearch}
      />
      
      <View style={styles.searchSection}>
        <View style={styles.filters}>
          {['Proximity', 'Rating', 'Availability'].map(type => (
            <TouchableOpacity 
              key={type}
              style={[styles.filterBtn, filterType === type && styles.activeFilter]}
              onPress={() => setFilterType(type)}
            >
              <Text style={[styles.filterText, filterType === type && styles.activeFilterText]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <FlatList
        data={sortedSellers}
        renderItem={renderSeller}
        keyExtractor={item => item.id.toString()}
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loaderFooter}>
              <ActivityIndicator color={COLORS.primary} />
            </View>
          ) : null
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Search size={64} color={COLORS.gray} />
              <Text style={styles.emptyTitle}>No Vendors Registered</Text>
              <Text style={styles.emptyText}>There are no food outlets registered on the service yet. Check back later!</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  searchSection: {
    padding: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 15,
    borderRadius: 12,
    height: 50,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  filterBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  activeFilter: {
    backgroundColor: COLORS.secondary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  activeFilterText: {
    color: COLORS.primary,
  },
  listContent: {
    padding: 20,
  },
  sellerCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    alignItems: 'center',
  },
  sellerImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.gray,
    marginRight: 15,
    overflow: 'hidden',
  },
  sellerListImage: {
    width: '100%',
    height: '100%',
  },
  sellerIconPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
  },
  sellerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sellerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  sellerDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  sellerDetailText: {
    fontSize: 14,
    color: COLORS.darkGray,
    flex: 1,
  },
  sellerFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 51, 102, 0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  mapBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 100,
  },
  emptyTitle: {
    marginTop: 20,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: COLORS.darkGray,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});

export default SellerDiscoveryScreen;
