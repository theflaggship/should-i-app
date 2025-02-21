// src/screens/ProfileScreen.js
import React, { useContext, useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { getUserPolls } from '../services/userService';
import PollCard from '../components/PollCard';
import colors from '../styles/colors';

const ProfileScreen = ({ navigation }) => {
  const { user, token, logout } = useContext(AuthContext);
  const [myPolls, setMyPolls] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      const data = await getUserPolls(user.id, token);
      setMyPolls(data);
    } catch (err) {
      console.error('Error fetching user polls:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyPolls();
  }, [user]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>@{user?.username}</Text>
      <Button title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
      <Button title="Logout" onPress={logout} color="#FF3B30" />

      <Text style={[styles.text, { marginTop: 16 }]}>My Polls:</Text>
      {loading ? (
        <Text>Loading polls...</Text>
      ) : (
        <FlatList
          data={myPolls}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => <PollCard poll={item} />}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: 16 },
  title: { fontSize: 24, textAlign: 'center', marginBottom: 16, color: colors.dark },
  text: { fontSize: 16, color: colors.dark },
});

export default ProfileScreen;
