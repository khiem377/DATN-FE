export const apiGetAllBook = async () => {
    try {
        
        const url = `http://127.0.0.1:8000/api/books`;

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
     
            },
        });

        const data = await response.json();

        if (!response.ok || data.result === 0) {
            throw new Error(data.msg || 'Lỗi khi lấy danh sách sách');
        }

        return data;
    } catch (error) {
        console.error('Lỗi khi gọi API :', error);
        throw error;
    }
};