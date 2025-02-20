// src/screens/HomeScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { getPolls } from '../services/pollService';
import globalStyles from '../styles/globalStyles';
import colors from '../styles/colors';
import PollCard from '../components/PollCard';

const HomeScreen = ({ navigation }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPolls = async () => {
    try {
      const data = await getPolls();
      setPolls(data);
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('PollDetails', { pollId: item.id })}>
      <PollCard poll={item} />
    </TouchableOpacity>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Discover Polls</Text>
      {loading ? (
        <Text style={globalStyles.text}>Loading polls...</Text>
      ) : (
        <FlatList
          data={polls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
        />
      )}
    </View>
  );
};

export default HomeScreen;
