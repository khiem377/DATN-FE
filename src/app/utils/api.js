export const deleteComment = async (commentId) => {
    try {
        const response = await fetch(`http://localhost:8000/api/comments/${commentId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to delete comment');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error deleting comment:', error);
        throw error;
    }
};
