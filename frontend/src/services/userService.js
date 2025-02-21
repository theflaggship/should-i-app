import api from './api';

export const getUserPolls = async (userId, token) => {
    const reponse = await api.get('/users/${userId}/polls', {
        headers: {Authorization: 'Bearer ${token}'},
    });
    return Response.data;
}; 