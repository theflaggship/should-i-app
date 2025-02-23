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
        renderItem={({ item }) => (
          <View style={styles.commentItem}>
            <Text style={styles.commentAuthor}>{item.User?.username}</Text>
            <Text style={styles.commentText}>{item.text}</Text>
          </View>
        )}
        style={styles.commentsList}
      />

      <View style={styles.commentInputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a comment..."
          value={commentText}
          onChangeText={setCommentText}
        />
        <Button title="Add" onPress={handleAddComment} disabled={!commentText.trim()} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  pollDetails: { marginBottom: 12 },
  question: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  optionRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 4 },
  commentsList: { flex: 1 },
  commentItem: { padding: 8, borderBottomWidth: 1, borderColor: '#ccc' },
  commentAuthor: { fontWeight: '600' },
  commentText: { marginTop: 4 },
  commentInputContainer: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginRight: 8 },
});

export default PollDetailsScreen;
