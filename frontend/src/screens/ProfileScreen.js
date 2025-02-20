// src/screens/ProfileScreen.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import globalStyles from '../styles/globalStyles';
import PollCard from '../components/PollCard';
import { getPolls } from '../services/pollService'; // For My Polls
// You could add a service for My Votes as needed

const ProfileScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [myPolls, setMyPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPolls = async () => {
    try {
      const polls = await getPolls(); // In practice, filter by userId
      setMyPolls(polls.filter(poll => poll.userId === user.id));
    } catch (error) {
      console.error('Error fetching polls:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPolls();
  }, [user]);

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Profile</Text>
      <Text style={globalStyles.text}>Username: {user.username}</Text>
      {/* Display personal summary, follower counts, and top topics */}
      <Button title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} color="#21D0B2" />
      <Button title="Logout" onPress={logout} color="#FF3B30" />
      <Text style={[globalStyles.text, { marginTop: 16 }]}>My Polls:</Text>
      {loading ? (
        <Text style={globalStyles.text}>Loading polls...</Text>
      ) : (
        <FlatList
          data={myPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity onPress={() => navigation.navigate('PollDetails', { pollId: item.id })}>
              <PollCard poll={item} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

export default ProfileScreen;
