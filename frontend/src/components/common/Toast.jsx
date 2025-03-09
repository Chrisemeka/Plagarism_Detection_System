export default function Toast({ message, type, onClose }) {
    return (
      <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        type === 'success' ? 'bg-green-500' : 'bg-red-500'
      } text-white`}>
        <div className="flex items-center">
          <span>{message}</span>
          <button onClick={onClose} className="ml-4">×</button>
        </div>
      </div>
    );
  }