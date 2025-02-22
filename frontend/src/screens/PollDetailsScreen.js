import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, FlatList, StyleSheet } from 'react-native';
import { getPollById, addComment } from '../services/pollService';
import colors from '../styles/colors';

const PollDetailsScreen = ({ route }) => {
  const { pollId } = route.params;
  const [poll, setPoll] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchPoll = async () => {
      const data = await getPollById(pollId);
      setPoll(data);
      setComments(data.comments);
    };

    fetchPoll();
  }, [pollId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) return;
    const newComment = await addComment(pollId, commentText);
    setComments((prev) => [newComment, ...prev]); // Add new comment
    setCommentText('');
  };

  if (!poll) return <Text>Loading...</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.question}>{poll.question}</Text>

      <FlatList
        data={comments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => <Text style={styles.comment}>{item.text}</Text>}
      />

      <TextInput
        style={styles.input}
        placeholder="Add a comment..."
        value={commentText}
        onChangeText={setCommentText}
      />

      <Button title="Add" onPress={handleAddComment} disabled={!commentText.trim()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  question: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderRadius: 6, padding: 8, marginTop: 10 },
  comment: { padding: 8, borderBottomWidth: 1 },
});

export default PollDetailsScreen;
