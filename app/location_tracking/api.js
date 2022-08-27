// fetchAPI => return data
const url = "http://127.0.0.1:5501";

const fetchAPI = async () => {
	try {
		console.log("fetch ongoing");
		const response = await fetch(url);
		console.log("fetch done: ", response.data);
		return response.data;
	} catch (err) {
		console.log(err);
	}
};

export default fetchAPI;
