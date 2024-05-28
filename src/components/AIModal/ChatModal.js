import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  CircularProgress,
  Box,
} from "@mui/material";
import MicIcon from '@mui/icons-material/Mic';
import axios from "axios";
import ChatBubble from "./ChatBubble"; // ChatBubble 컴포넌트 임포트
import BudgetModal from "./BudgetModal"; // 예산 입력 모달 컴포넌트 임포트
import useSpeechRecognition from "./useSpeechRecognition"; // 음성 인식 훅 임포트

const ChatModal = ({ open, onClose, cart, totalAmount, setCart }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isFirstInteraction, setIsFirstInteraction] = useState(true);
  const [loading, setLoading] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false); // 예산 모달 열림 상태
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [awaitingItemInput, setAwaitingItemInput] = useState(false);
  const userId = 2222; // 예시 ID 값, 실제 ID 값으로 대체

  useEffect(() => {
    if (open && isFirstInteraction) {
      setMessages([{ text: "", sender: "ai", clickable: false }]);
      setIsFirstInteraction(false);
      startTypingAnimation("안녕하세요! AI 도우미입니다. 무엇을 도와드릴까요?");
    }
  }, [open, isFirstInteraction, startTypingAnimation]);

  useEffect(() => {
    if (open) {
      // 음성 인식을 시작합니다.
      startSpeechRecognition();
    }
  }, [open]);

  const startTypingAnimation = (text) => {
    setIsTyping(true);
    let index = 0;
    const interval = setInterval(() => {
      setTypingText(text.slice(0, index + 1));
      index += 1;
      if (index === text.length) {
        clearInterval(interval);
        setIsTyping(false);
        setMessages((prevMessages) => {
          const newMessages = [...prevMessages];
          newMessages[0].text = text;
          return newMessages;
        });
        setTypingText("");
        showNextMessages();
      }
    }, 150); // 타이핑 속도 조절 (밀리초 단위)
  };

  const showNextMessages = () => {
    const predefinedMessages = [
      "ex)오늘 날씨에 맞는 메뉴를 추천해줘.",
      "ex)김치찌개에 대해서 설명해줘.",
      "ex)예산에 맞는 메뉴를 추천해줘.",
      "ex)다른 명령어는 뭐가 있어?",
      "ex)장바구니에 물건을 담고 싶어",
    ];

    setMessages((prevMessages) => [
      ...prevMessages,
      ...predefinedMessages.map((message) => ({
        text: message,
        sender: "user",
        clickable: true,
        id_Value: userId,
      })),
    ]);
  };

  const handleSendMessage = async (messageText, messageId = null, paymentData = null) => {
    if (isFirstInteraction) {
      setMessages([]);
      setIsFirstInteraction(false);
    }

    const userMessage = {
      text: messageText,
      sender: "user",
      id_Value: messageId || userId,
      paymentData: paymentData || null,
    };

    if (awaitingItemInput) {
      const items = [messageText.replace(" 담아줘.", "").trim()]; // items 필드를 리스트로 설정
      const addToCartRequest = {
        user_id: userId,
        items: items,
      };
      userMessage.items = addToCartRequest.items; // 올바른 형식으로 items 설정
      userMessage.user_id = addToCartRequest.user_id;
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { text: messageText, sender: "user" },
    ]);
    setLoading(true);

    try {
      const endpoint = awaitingItemInput
        ? "http://localhost:8000/users/addToCart"
        : messageText === "ex)장바구니에 있는 물건들 결제해줘."
        ? "http://localhost:8000/users/paymentAPI"
        : "http://localhost:8000/users/ai";

      const requestData = awaitingItemInput ? { user_id: userId, items: userMessage.items } : userMessage;

      const response = await axios.post(endpoint, requestData);
      const aiMessage = { text: response.data.message, sender: "ai" };
      setMessages((prevMessages) => [...prevMessages, aiMessage]);

      // 클라이언트 측 장바구니에 아이템 추가
      if (endpoint === "http://localhost:8000/users/addToCart" && response.data.items) {
        // 변경된 부분 시작
        const productDetails = response.data.items.map(item => ({ title: item.product_name, price: item.price }));
        setCart((prevCart) => [...prevCart, ...productDetails]);
        // 변경된 부분 끝
        setAwaitingItemInput(false); // 아이템 입력 대기 상태 해제
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "서버 응답 실패", sender: "ai" },
      ]);
    } finally {
      setLoading(false);
    }

    setNewMessage("");
  };

  const handleBudgetSubmit = (budget) => {
    setBudgetModalOpen(false); // 예산 모달 닫기
    handleSendMessage(`예산에 맞는 메뉴를 추천해줘, 예산은 ${budget}원 이야.`);
  };

  const handleMessageClick = (message) => {
    if (message.text === "ex)예산에 맞는 메뉴를 추천해줘.") {
      setBudgetModalOpen(true); // 예산 모달 열기
    } else if (message.text === "ex)장바구니에 있는 물건들 결제해줘.") {
      const paymentData = {
        item_name: cart.map((item) => item.title).join(", "),
        quantity: cart.length,
        total_amount: totalAmount,
      };
      handleSendMessage(message.text, message.id_Value, paymentData);
    } else if (message.text === "ex)다른 명령어는 뭐가 있어?") {
      setMessages([]);
      setTimeout(() => {
        const otherCommands = [
          "ex)오늘 날씨에 맞는 메뉴를 추천해줘.",
          "ex)김치찌개에 대해서 설명해줘.",
          "ex)예산에 맞는 메뉴를 추천해줘.",
          "ex)장바구니에 있는 물건들 결제해줘.",
          "ex)된장찌게 장바구니에 담아줘",
        ];

        setMessages(
          otherCommands.map((cmd) => ({
            text: cmd,
            sender: "ai",
            clickable: true,
          }))
        );
      }, 500); // 0.5초 후에 다른 명령어들 추가
    } else if (message.text === "ex)장바구니에 물건을 담고 싶어") {
      setMessages((prevMessages) => [
        ...prevMessages,
        { text: "장바구니에 물건을 담는 것을 도와드릴께요! 어떤 물건을 담을까요?", sender: "ai", clickable: false },
      ]);
      setAwaitingItemInput(true); // 아이템 입력 대기 상태 설정
    } else {
      handleSendMessage(message.text, message.id_Value);
    }
  };

  const { startSpeechRecognition } = useSpeechRecognition(
    (speechResult) => {
      const finalMessage = awaitingItemInput ? `${speechResult} 담아줘.` : speechResult;
      setNewMessage(finalMessage);
      handleSendMessage(finalMessage);
    },
    (event) => {
      console.error('Speech recognition error', event);
    }
  );

  return (
    <Dialog
      open={open}
      onClose={() => {
        setMessages([]); // 대화 내용 초기화
        setIsFirstInteraction(true); // 첫 상호작용 상태로 되돌리기
        onClose();
      }}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        style: {
          minHeight: "700px",
          maxHeight: "700px",
          minWidth: "500px",
          maxWidth: "500px",
        },
      }}
    >
      <DialogTitle>{"AI 도우미 채팅"}</DialogTitle>
      <DialogContent style={{ padding: 0 }}>
        <Box style={{ height: "500px", overflowY: "auto", padding: "16px" }}>
          {messages.map((message, index) => (
            <Box
              key={index}
              onClick={() => message.clickable && handleMessageClick(message)}
            >
              {index === 0 && isTyping ? (
                <ChatBubble message={{ text: typingText, sender: "ai" }} />
              ) : (
                <ChatBubble message={message} />
              )}
            </Box>
          ))}
          {loading && (
            <Box
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                padding: "10px",
              }}
            >
              <CircularProgress />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions style={{ display: "flex", alignItems: "center" }}>
        <TextField
          autoFocus
          margin="dense"
          id="newMessage"
          label="메시지 입력"
          type="text"
          variant="outlined"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSendMessage(newMessage);
            }
          }}
          style={{ flex: 1, marginRight: "8px" }}
        />
        <Button
          onClick={() => startSpeechRecognition()}
          color="primary"
          variant="contained"
          endIcon={<MicIcon />}
          style={{ marginLeft: "8px" }}
        >
          음성 입력
        </Button>
        <Button onClick={onClose} color="primary" style={{ marginLeft: "8px" }}>
          닫기
        </Button>
      </DialogActions>
      <BudgetModal
        open={budgetModalOpen} // 예산 모달 열기 상태 전달
        onClose={() => setBudgetModalOpen(false)} // 예산 모달 닫기 상태 전달
        onSubmit={handleBudgetSubmit} // 예산 모달 제출 핸들러 전달
      />
    </Dialog>
  );
};

export default ChatModal;
