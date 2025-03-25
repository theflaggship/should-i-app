// src/screens/SearchScreen.js
import React, { useState } from 'react';
import { View, TextInput, Button, FlatList, Text, StyleSheet } from 'react-native';
import globalStyles from '../../styles/globalStyles';
import colors from '../../styles/colors';
import { getPolls } from '../../services/pollService'; // Or a dedicated search service

const SearchScreen = ({ navigation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      // For simplicity, we reuse getPolls and filter results on the front end.
      const allPolls = await getPolls();
      const filtered = allPolls.filter(poll =>
        poll.question.toLowerCase().includes(query.toLowerCase())
      );
      setResults(filtered);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }) => (
    <Text style={styles.item}>{item.question}</Text>
  );

  return (
    <View style={globalStyles.container}>
      <Text style={globalStyles.title}>Search Polls</Text>
      <TextInput
        style={styles.input}
        placeholder="Enter search term"
        value={query}
        onChangeText={setQuery}
      />
      <Button title="Search" onPress={handleSearch} color={colors.primary} />
      {loading ? <Text style={globalStyles.text}>Searching...</Text> : null}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  input: {
    fontFamily: 'Quicksand-Medium',
    borderWidth: 1,
    borderColor: colors.dark,
    padding: 12,
    borderRadius: 4,
    marginVertical: 8
  },
  item: {
    fontFamily: 'Quicksand-Medium',
    fontSize: 16,
    marginVertical: 4,
    color: colors.dark
  }
});

export default SearchScreen;
