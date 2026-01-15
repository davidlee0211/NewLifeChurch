"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import type { Team } from "@/types/database";
import { Dices, RotateCcw, Trophy, Sparkles, Play, Check, Eye, Maximize, Minimize } from "lucide-react";

// 보드판 칸 수 (0~16, 총 17칸)
const BOARD_SIZE = 17;

// 보드판 칸 데이터
interface BoardCell {
  id: number;
  type: "start" | "normal" | "bonus" | "finish";
  label: string;
  effect?: number; // +1 보너스
}

// 보드판 칸 생성 - S자 형태
// 상단(0-4, →), 연결(5, ↓), 중간(6-10, ←), 연결(11, ↓), 하단(12-16, →)
const generateBoardCells = (): BoardCell[] => {
  const cells: BoardCell[] = [];

  for (let i = 0; i < BOARD_SIZE; i++) {
    if (i === 0) {
      cells.push({ id: i, type: "start", label: "출발" });
    } else if (i === BOARD_SIZE - 1) {
      cells.push({ id: i, type: "finish", label: "도착" });
    } else if (i === 2 || i === 5 || i === 8 || i === 11 || i === 14) {
      // +1 보너스 칸 (5개)
      cells.push({ id: i, type: "bonus", label: `${i}`, effect: 1 });
    } else {
      cells.push({ id: i, type: "normal", label: `${i}` });
    }
  }

  return cells;
};

// 팀 말 상태
interface TeamPiece {
  team: Team;
  position: number;
  isFinished: boolean;
}

// 퀴즈 인터페이스
interface BibleDiceQuiz {
  id: string;
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correct_answer: number;
}

// 주사위 결과 (가중치 적용: 1=70%, 2=25%, 3=5%)
const rollDice = (): number => {
  const rand = Math.random() * 100;
  if (rand < 70) return 1;
  if (rand < 95) return 2;
  return 3;
};

// 카훗 스타일 색상
const KAHOOT_COLORS = [
  "bg-red-500",
  "bg-blue-500",
  "bg-yellow-500",
  "bg-green-500"
];

const KAHOOT_SHAPES = ["▲", "◆", "●", "■"];

export default function BibleDicePage() {
  const { churchId } = useAuth();
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPieces, setTeamPieces] = useState<TeamPiece[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [winner, setWinner] = useState<Team | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 퀴즈 관련 상태
  const [quizzes, setQuizzes] = useState<BibleDiceQuiz[]>([]);
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  // 게임 단계: idle -> showing_quiz -> answer_revealed -> selecting_teams -> rolling_dice
  const [gamePhase, setGamePhase] = useState<"idle" | "showing_quiz" | "answer_revealed" | "selecting_teams" | "rolling_dice">("idle");

  // 정답 맞춘 팀들 (여러 팀 선택 가능)
  const [correctTeams, setCorrectTeams] = useState<Set<string>>(new Set());

  // 주사위 굴리는 팀 큐
  const [diceQueue, setDiceQueue] = useState<Team[]>([]);
  const [currentDiceTeam, setCurrentDiceTeam] = useState<Team | null>(null);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [effectMessage, setEffectMessage] = useState<string | null>(null); // +1/-1 효과 메시지
  const [isMoving, setIsMoving] = useState(false); // 말 이동 중 상태
  const moveInProgressRef = useRef(false); // 이동 중복 방지용 ref

  const boardCells = generateBoardCells();

  // 팀 및 퀴즈 데이터 로드
  useEffect(() => {
    const fetchData = async () => {
      if (!churchId) return;

      setIsLoading(true);

      // 팀 로드
      const { data: teamsData } = await supabase
        .from("teams")
        .select("*")
        .eq("church_id", churchId)
        .order("name");

      // 퀴즈 로드
      const { data: quizzesData } = await supabase
        .from("bible_dice_quizzes")
        .select("id, question, option1, option2, option3, option4, correct_answer")
        .eq("church_id", churchId)
        .eq("is_active", true);

      if (teamsData && teamsData.length > 0) {
        setTeams(teamsData as Team[]);
        setTeamPieces((teamsData as Team[]).map(team => ({
          team,
          position: 0,
          isFinished: false
        })));
      }

      if (quizzesData) {
        // 퀴즈 섞기
        const shuffled = [...quizzesData as BibleDiceQuiz[]].sort(() => Math.random() - 0.5);
        setQuizzes(shuffled);
      }

      setIsLoading(false);
    };

    fetchData();
  }, [churchId]);

  // 전체화면 토글 (메인 컨텐츠 영역만)
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // 현재 퀴즈
  const currentQuiz = quizzes[currentQuizIndex];

  // 게임 시작
  const startGame = () => {
    setGameStarted(true);
    setWinner(null);
    setTeamPieces(teams.map(team => ({
      team,
      position: 0,
      isFinished: false
    })));
    setCurrentQuizIndex(0);
    setShowAnswer(false);
    setCorrectTeams(new Set());
    setDiceQueue([]);
    setCurrentDiceTeam(null);
    setDiceResult(null);
    setGamePhase("idle");
    setEffectMessage(null);
  };

  // 게임 리셋
  const resetGame = () => {
    setGameStarted(false);
    setWinner(null);
    setTeamPieces(teams.map(team => ({
      team,
      position: 0,
      isFinished: false
    })));
    setCurrentQuizIndex(0);
    setShowAnswer(false);
    setCorrectTeams(new Set());
    setDiceQueue([]);
    setCurrentDiceTeam(null);
    setDiceResult(null);
    setGamePhase("idle");
    setEffectMessage(null);
  };

  // 퀴즈 출제 (문제 보여주기)
  const handleShowQuiz = () => {
    if (!currentQuiz) {
      alert("퀴즈가 모두 소진되었습니다!");
      return;
    }
    setShowAnswer(false);
    setCorrectTeams(new Set());
    setGamePhase("showing_quiz");
  };

  // 정답 공개
  const handleRevealAnswer = () => {
    setShowAnswer(true);
    setGamePhase("answer_revealed");
  };

  // 팀 선택 단계로 이동
  const handleGoToTeamSelection = () => {
    setGamePhase("selecting_teams");
  };

  // 팀 선택 토글 (정답 맞춘 팀)
  const toggleTeamCorrect = (teamId: string) => {
    setCorrectTeams(prev => {
      const newSet = new Set(prev);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return newSet;
    });
  };

  // 주사위 굴리기 시작 (선택된 팀들 순서대로)
  const handleStartDiceRolling = () => {
    if (correctTeams.size === 0) {
      // 아무 팀도 맞추지 못함 -> 다음 문제로
      goToNextQuiz();
      return;
    }

    // 정답 맞춘 팀들을 큐에 넣기
    const teamsToRoll = teams.filter(t => correctTeams.has(t.id));
    setDiceQueue(teamsToRoll);
    setCurrentDiceTeam(teamsToRoll[0]);
    setDiceResult(null);
    setEffectMessage(null);
    setGamePhase("rolling_dice");
  };

  // 주사위 굴리기
  const handleRollDice = () => {
    if (!currentDiceTeam) return;

    setIsRolling(true);
    setEffectMessage(null);

    // 주사위 애니메이션
    let rollCount = 0;
    const rollInterval = setInterval(() => {
      setDiceResult(Math.floor(Math.random() * 3) + 1);
      rollCount++;
      if (rollCount >= 15) {
        clearInterval(rollInterval);
        const finalResult = rollDice();
        setDiceResult(finalResult);
        setIsRolling(false);

        // 말 이동
        movePiece(currentDiceTeam, finalResult);
      }
    }, 100);
  };

  // 말 이동 (한 칸씩 애니메이션)
  const movePiece = (team: Team, steps: number) => {
    // 이미 이동 중이면 무시
    if (moveInProgressRef.current) return;
    moveInProgressRef.current = true;

    const teamId = team.id;
    setIsMoving(true);

    // 현재 위치 가져오기
    const currentPiece = teamPieces.find(p => p.team.id === teamId);
    if (!currentPiece) {
      moveInProgressRef.current = false;
      setIsMoving(false);
      return;
    }

    let position = currentPiece.position;
    let stepsMoved = 0;

    const moveOneStep = () => {
      if (stepsMoved >= steps) {
        // 모든 이동 완료 후 효과 칸 체크
        const cell = boardCells[position];

        if (cell.effect !== undefined && cell.effect !== 0) {
          const effectValue = cell.effect;
          setEffectMessage(effectValue > 0 ? `🎉 보너스! +${effectValue}칸 전진!` : `😢 페널티! ${effectValue}칸 후퇴!`);

          // 효과 적용 (한 칸 이동)
          setTimeout(() => {
            let finalPosition = position + effectValue;
            if (finalPosition < 0) finalPosition = 0;
            if (finalPosition >= BOARD_SIZE - 1) finalPosition = BOARD_SIZE - 1;

            setTeamPieces(prev => {
              const idx = prev.findIndex(p => p.team.id === teamId);
              if (idx === -1) return prev;

              const newPieces = [...prev];
              newPieces[idx] = {
                ...newPieces[idx],
                position: finalPosition,
                isFinished: finalPosition >= BOARD_SIZE - 1
              };

              if (finalPosition >= BOARD_SIZE - 1) {
                setWinner(newPieces[idx].team);
              }

              return newPieces;
            });

            moveInProgressRef.current = false;
            setIsMoving(false);
          }, 500);
        } else {
          moveInProgressRef.current = false;
          setIsMoving(false);
        }
        return;
      }

      stepsMoved++;
      position++;

      // 보드판 범위 제한
      if (position >= BOARD_SIZE - 1) {
        position = BOARD_SIZE - 1;
      }

      setTeamPieces(prev => {
        const idx = prev.findIndex(p => p.team.id === teamId);
        if (idx === -1) return prev;

        const newPieces = [...prev];
        newPieces[idx] = {
          ...newPieces[idx],
          position: position,
          isFinished: position >= BOARD_SIZE - 1
        };

        if (position >= BOARD_SIZE - 1) {
          setWinner(newPieces[idx].team);
        }

        return newPieces;
      });

      // 다음 칸 이동 (400ms 후)
      setTimeout(moveOneStep, 400);
    };

    // 첫 번째 이동 시작
    setTimeout(moveOneStep, 100);
  };

  // 다음 팀 주사위 또는 다음 문제
  const handleNextDiceOrQuiz = () => {
    const currentIndex = diceQueue.findIndex(t => t.id === currentDiceTeam?.id);

    if (currentIndex < diceQueue.length - 1) {
      // 다음 팀 주사위
      setCurrentDiceTeam(diceQueue[currentIndex + 1]);
      setDiceResult(null);
      setEffectMessage(null);
    } else {
      // 모든 팀 완료 -> 다음 문제
      goToNextQuiz();
    }
  };

  // 다음 퀴즈
  const goToNextQuiz = () => {
    setShowAnswer(false);
    setCorrectTeams(new Set());
    setDiceQueue([]);
    setCurrentDiceTeam(null);
    setDiceResult(null);
    setEffectMessage(null);
    setCurrentQuizIndex(prev => (prev + 1) % quizzes.length);
    setGamePhase("idle");
  };

  // 팀별 순위 계산
  const getRankings = () => {
    return [...teamPieces].sort((a, b) => b.position - a.position);
  };

  // 칸 색상
  const getCellColor = (cell: BoardCell) => {
    switch (cell.type) {
      case "start": return "bg-google-green";
      case "finish": return "bg-google-red";
      case "bonus": return "bg-google-yellow";
      default: return "bg-google-blue";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-google-blue rounded-2xl flex items-center justify-center animate-pulse mb-4">
            <Dices className="w-8 h-8 text-white" />
          </div>
          <p className="text-gray-500 font-bold">로딩 중...</p>
        </div>
      </div>
    );
  }

  // 팀이나 퀴즈가 없어도 게임 화면은 보여줌

  return (
    <div className={`space-y-4 sm:space-y-6 ${isFullscreen ? 'fixed inset-0 z-50 p-4 bg-white overflow-auto' : ''}`}>
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg sm:text-2xl font-black text-gray-800 flex items-center gap-2">
          <Dices className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
          바이블다이스
        </h2>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 text-xs sm:text-sm"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? "축소" : "전체화면"}</span>
          </Button>
          {gameStarted && (
            <Button variant="secondary" onClick={resetGame} className="flex items-center gap-1 text-xs sm:text-sm">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">초기화</span>
            </Button>
          )}
        </div>
      </div>

      {/* 게임 시작 전 */}
      {!gameStarted && !winner && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-lg border-2 border-purple-200">
          <Dices className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 text-purple-600" />
          <h3 className="text-xl sm:text-2xl font-black mb-2 text-gray-800">바이블다이스</h3>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">
            퀴즈를 맞추고 주사위를 굴려 먼저 도착점에 도달하세요!
          </p>
          <div className="flex flex-wrap justify-center gap-2 mb-6">
            {teams.length > 0 ? (
              teams.map(team => (
                <div
                  key={team.id}
                  className="px-3 py-1.5 rounded-full text-white text-xs sm:text-sm font-bold"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name}
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-sm">팀이 아직 없습니다</p>
            )}
          </div>
          <Button
            onClick={startGame}
            size="lg"
            className="font-bold text-base sm:text-lg px-8 py-3 inline-flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5" />
            게임 시작
          </Button>
        </div>
      )}

      {/* 승자 화면 */}
      {winner && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center shadow-lg border-2 border-yellow-300">
          <Trophy className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 text-google-yellow" />
          <h3 className="text-2xl sm:text-3xl font-black text-gray-800 mb-2">우승!</h3>
          <div
            className="inline-block px-6 py-3 rounded-2xl text-white text-xl sm:text-2xl font-black mb-6"
            style={{ backgroundColor: winner.color }}
          >
            {winner.name}
          </div>
          <div>
            <Button onClick={resetGame} className="font-bold inline-flex items-center justify-center gap-2">
              <RotateCcw className="w-4 h-4" />
              다시 시작
            </Button>
          </div>
        </div>
      )}

      {/* 게임 진행 중 */}
      {gameStarted && !winner && (
        <>
          {/* 보드판 - S자 형태 */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 shadow-lg border-2 border-gray-100">
            {/*
              S자 형태 보드판 (아래→위):
              [12][13][14][15][16] - 도착
              [11]
              [10][9][8][7][6]
                          [5]
              [0][1][2][3][4] - 출발
            */}
            <div className="max-w-xs sm:max-w-sm mx-auto">
              {/* 5행: 12-16 (→) - 도착 */}
              <div className="flex">
                <div className="grid grid-cols-5 gap-0.5 sm:gap-1 flex-1">
                  {boardCells.slice(12, 17).map((cell) => (
                    <div
                      key={cell.id}
                      className={`${getCellColor(cell)} aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center relative`}
                    >
                      <span className="text-[7px] sm:text-[10px] text-white font-bold">{cell.label}</span>
                      {cell.type === "bonus" && <span className="text-[8px] sm:text-xs text-white">+1</span>}
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                        {teamPieces
                          .filter(p => p.position === cell.id)
                          .map(p => (
                            <div
                              key={p.team.id}
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-md transition-all duration-500"
                              style={{ backgroundColor: p.team.color }}
                              title={p.team.name}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4행: 11 (↑) - 왼쪽 연결 */}
              <div className="flex justify-start my-0.5 sm:my-1">
                <div className="w-[calc(20%-2px)] sm:w-[calc(20%-4px)]">
                  {boardCells[11] && (
                    <div
                      className={`${getCellColor(boardCells[11])} aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center relative`}
                    >
                      <span className="text-[7px] sm:text-[10px] text-white font-bold">{boardCells[11].label}</span>
                      {boardCells[11].type === "bonus" && <span className="text-[8px] sm:text-xs text-white">+1</span>}
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                        {teamPieces
                          .filter(p => p.position === 11)
                          .map(p => (
                            <div
                              key={p.team.id}
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-md transition-all duration-500"
                              style={{ backgroundColor: p.team.color }}
                              title={p.team.name}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 3행: 10-6 (←) - 역순 */}
              <div className="flex">
                <div className="grid grid-cols-5 gap-0.5 sm:gap-1 flex-1">
                  {[...boardCells.slice(6, 11)].reverse().map((cell) => (
                    <div
                      key={cell.id}
                      className={`${getCellColor(cell)} aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center relative`}
                    >
                      <span className="text-[7px] sm:text-[10px] text-white font-bold">{cell.label}</span>
                      {cell.type === "bonus" && <span className="text-[8px] sm:text-xs text-white">+1</span>}
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                        {teamPieces
                          .filter(p => p.position === cell.id)
                          .map(p => (
                            <div
                              key={p.team.id}
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-md transition-all duration-500"
                              style={{ backgroundColor: p.team.color }}
                              title={p.team.name}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 2행: 5 (↑) - 오른쪽 연결 */}
              <div className="flex justify-end my-0.5 sm:my-1">
                <div className="w-[calc(20%-2px)] sm:w-[calc(20%-4px)]">
                  {boardCells[5] && (
                    <div
                      className={`${getCellColor(boardCells[5])} aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center relative`}
                    >
                      <span className="text-[7px] sm:text-[10px] text-white font-bold">{boardCells[5].label}</span>
                      {boardCells[5].type === "bonus" && <span className="text-[8px] sm:text-xs text-white">+1</span>}
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                        {teamPieces
                          .filter(p => p.position === 5)
                          .map(p => (
                            <div
                              key={p.team.id}
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-md transition-all duration-500"
                              style={{ backgroundColor: p.team.color }}
                              title={p.team.name}
                            />
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 1행: 0-4 (→) - 출발 */}
              <div className="flex">
                <div className="grid grid-cols-5 gap-0.5 sm:gap-1 flex-1">
                  {boardCells.slice(0, 5).map((cell) => (
                    <div
                      key={cell.id}
                      className={`${getCellColor(cell)} aspect-square rounded-md sm:rounded-lg flex flex-col items-center justify-center relative`}
                    >
                      <span className="text-[7px] sm:text-[10px] text-white font-bold">{cell.label}</span>
                      {cell.type === "bonus" && <span className="text-[8px] sm:text-xs text-white">+1</span>}
                                            <div className="flex flex-wrap gap-0.5 justify-center">
                        {teamPieces
                          .filter(p => p.position === cell.id)
                          .map(p => (
                            <div
                              key={p.team.id}
                              className="w-2 h-2 sm:w-3 sm:h-3 rounded-full border border-white shadow-md transition-all duration-500"
                              style={{ backgroundColor: p.team.color }}
                              title={p.team.name}
                            />
                          ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 범례 */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-4 mt-4 text-[10px] sm:text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-google-green rounded" />
                <span className="text-gray-600">출발</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-google-blue rounded" />
                <span className="text-gray-600">일반</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-google-yellow rounded" />
                <span className="text-gray-600">+1 보너스</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-google-red rounded" />
                <span className="text-gray-600">도착</span>
              </div>
            </div>

            {/* 팀 현황 */}
            <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-4">
              {teamPieces.length > 0 ? (
                teamPieces.map((piece) => (
                  <div key={piece.team.id} className="flex items-center gap-1.5 bg-gray-50 px-2 py-1 rounded-lg">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-white shadow"
                      style={{ backgroundColor: piece.team.color }}
                    />
                    <span className="text-xs font-bold text-gray-700">{piece.team.name}</span>
                    <span className="text-xs text-gray-500">{piece.position}칸</span>
                  </div>
                ))
              ) : (
                <p className="text-xs text-gray-400">팀이 없습니다 - 팀 뽑기에서 먼저 팀을 생성하세요</p>
              )}
            </div>
          </div>

          {/* 게임 컨트롤 영역 */}

          {/* 대기 상태 - 문제 출제 버튼 */}
          {gamePhase === "idle" && (
            <div className="bg-white rounded-2xl p-6 text-center shadow-lg border-2 border-purple-200">
              {quizzes.length > 0 ? (
                <>
                  <p className="text-gray-600 mb-4 text-sm sm:text-base font-bold">
                    퀴즈 {currentQuizIndex + 1} / {quizzes.length}
                  </p>
                  <Button
                    onClick={handleShowQuiz}
                    size="lg"
                    className="font-bold text-base sm:text-lg px-8 inline-flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-5 h-5" />
                    문제 출제
                  </Button>
                </>
              ) : (
                <div className="py-4">
                  <p className="text-gray-700 mb-2 text-sm sm:text-base font-bold">
                    등록된 퀴즈가 없습니다
                  </p>
                  <p className="text-gray-400 text-xs sm:text-sm">
                    퀴즈 관리에서 퀴즈를 먼저 추가해주세요
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 퀴즈 화면 (카훗 스타일) */}
          {(gamePhase === "showing_quiz" || gamePhase === "answer_revealed") && currentQuiz && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 space-y-4 shadow-lg border-2 border-purple-200">
              {/* 문제 */}
              <div className="bg-purple-100 rounded-2xl p-4 sm:p-6 text-center">
                <span className="text-xs sm:text-sm text-purple-600 font-bold mb-2 block">Q{currentQuizIndex + 1}</span>
                <p className="text-base sm:text-xl lg:text-2xl font-black text-gray-800">
                  {currentQuiz.question}
                </p>
              </div>

              {/* 4지선다 - 카훗 스타일 */}
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                {[currentQuiz.option1, currentQuiz.option2, currentQuiz.option3, currentQuiz.option4].map((option, index) => {
                  const isCorrect = index + 1 === currentQuiz.correct_answer;

                  let buttonStyle = KAHOOT_COLORS[index];
                  if (showAnswer) {
                    if (isCorrect) {
                      buttonStyle = "bg-green-500 ring-4 ring-green-300 scale-105";
                    } else {
                      buttonStyle = "bg-gray-400 opacity-50";
                    }
                  }

                  return (
                    <div
                      key={index}
                      className={`${buttonStyle} p-3 sm:p-4 rounded-xl sm:rounded-2xl text-white font-bold text-xs sm:text-base flex items-center gap-2 min-h-[60px] sm:min-h-[80px] transition-all duration-300`}
                    >
                      <span className="text-lg sm:text-2xl">{KAHOOT_SHAPES[index]}</span>
                      <span className="flex-1">{option}</span>
                      {showAnswer && isCorrect && (
                        <Check className="w-5 h-5 sm:w-6 sm:h-6" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* 정답 공개 버튼 */}
              {gamePhase === "showing_quiz" && !showAnswer && (
                <div className="text-center pt-2">
                  <Button
                    onClick={handleRevealAnswer}
                    size="lg"
                    className="font-bold inline-flex items-center justify-center gap-2"
                  >
                    <Eye className="w-5 h-5" />
                    정답 공개
                  </Button>
                </div>
              )}

              {/* 정답 공개 후 다음 단계 버튼 */}
              {gamePhase === "answer_revealed" && (
                <div className="text-center pt-2">
                  <Button
                    onClick={handleGoToTeamSelection}
                    size="lg"
                    className="font-bold inline-flex items-center justify-center gap-2"
                  >
                    <Check className="w-5 h-5" />
                    정답 맞춘 팀 선택하기
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* 팀 선택 화면 (정답 맞춘 팀 선택) */}
          {gamePhase === "selecting_teams" && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-lg border-2 border-purple-200">
              <h3 className="text-lg sm:text-xl font-black text-gray-800 mb-4 text-center">
                정답 맞춘 팀을 선택하세요!
              </h3>
              <p className="text-gray-500 text-sm text-center mb-4">여러 팀 선택 가능</p>

              <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6">
                {teams.map(team => {
                  const isSelected = correctTeams.has(team.id);
                  return (
                    <button
                      key={team.id}
                      onClick={() => toggleTeamCorrect(team.id)}
                      className={`p-4 sm:p-6 rounded-2xl text-white font-bold text-base sm:text-lg transition-all ${
                        isSelected ? "ring-4 ring-green-400 scale-105" : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: team.color }}
                    >
                      <div className="flex items-center justify-center gap-2">
                        {isSelected && <Check className="w-5 h-5 sm:w-6 sm:h-6" />}
                        {team.name}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-3 justify-center">
                <Button
                  onClick={handleStartDiceRolling}
                  size="lg"
                  className="font-bold inline-flex items-center justify-center gap-2"
                >
                  <Dices className="w-5 h-5" />
                  {correctTeams.size > 0 ? `주사위 굴리기 (${correctTeams.size}팀)` : "아무도 못 맞춤 → 다음 문제"}
                </Button>
              </div>
            </div>
          )}

          {/* 주사위 굴리기 화면 */}
          {gamePhase === "rolling_dice" && currentDiceTeam && (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-lg border-2 border-purple-200">
              <div className="text-center">
                {/* 현재 팀 표시 */}
                <div
                  className="inline-block px-6 py-2 rounded-full text-white font-bold text-lg sm:text-xl mb-6"
                  style={{ backgroundColor: currentDiceTeam.color }}
                >
                  {currentDiceTeam.name}
                </div>

                {/* 대기 중인 팀 표시 */}
                {diceQueue.length > 1 && (
                  <div className="flex justify-center gap-2 mb-4">
                    {diceQueue.map((t) => (
                      <div
                        key={t.id}
                        className={`w-3 h-3 rounded-full ${
                          t.id === currentDiceTeam.id ? "ring-2 ring-purple-500" : "opacity-50"
                        }`}
                        style={{ backgroundColor: t.color }}
                      />
                    ))}
                  </div>
                )}

                {/* 주사위 (실제 주사위 모양) */}
                <div className={`w-28 h-28 sm:w-36 sm:h-36 bg-purple-100 rounded-3xl shadow-lg mb-6 mx-auto ${isRolling ? 'animate-spin' : ''} p-4 sm:p-5`}>
                  {diceResult === null && !isRolling ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-4xl sm:text-5xl font-black text-purple-700">?</span>
                    </div>
                  ) : (
                    <div className="w-full h-full grid grid-cols-3 grid-rows-3 gap-1">
                      {/* 1: 중앙 */}
                      {diceResult === 1 && (
                        <>
                          <div /><div /><div />
                          <div /><div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" /><div />
                          <div /><div /><div />
                        </>
                      )}
                      {/* 2: 대각선 */}
                      {diceResult === 2 && (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" /><div /><div />
                          <div /><div /><div />
                          <div /><div /><div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" />
                        </>
                      )}
                      {/* 3: 대각선 */}
                      {diceResult === 3 && (
                        <>
                          <div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" /><div /><div />
                          <div /><div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" /><div />
                          <div /><div /><div className="w-4 h-4 sm:w-5 sm:h-5 bg-purple-700 rounded-full m-auto" />
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* 보너스 메시지 */}
                {effectMessage && (
                  <p className="text-lg sm:text-xl font-bold text-green-600 mb-4 animate-pulse">
                    {effectMessage}
                  </p>
                )}

                {/* 버튼 */}
                {!diceResult && !isRolling && (
                  <Button
                    onClick={handleRollDice}
                    size="lg"
                    className="font-bold text-lg px-8 inline-flex items-center justify-center gap-2"
                  >
                    <Dices className="w-6 h-6" />
                    주사위 굴리기!
                  </Button>
                )}

                {diceResult && !isRolling && (
                  <div className="space-y-4">
                    <p className="text-2xl sm:text-3xl font-black text-purple-700">
                      {diceResult}칸 이동!
                    </p>
                    <Button
                      onClick={handleNextDiceOrQuiz}
                      disabled={isMoving}
                      className="font-bold inline-flex items-center justify-center gap-2"
                    >
                      {isMoving ? "이동 중..." : diceQueue.findIndex(t => t.id === currentDiceTeam.id) < diceQueue.length - 1
                        ? "다음 팀 주사위"
                        : "다음 문제로"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 순위표 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-md">
            <h4 className="font-bold text-gray-800 mb-3 text-sm sm:text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-google-yellow" />
              현재 순위
            </h4>
            <div className="space-y-2">
              {getRankings().map((piece, idx) => (
                <div
                  key={piece.team.id}
                  className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 rounded-xl"
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    <span className="text-base sm:text-lg font-bold text-gray-400 w-5">
                      {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `${idx + 1}`}
                    </span>
                    <div
                      className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm"
                      style={{ backgroundColor: piece.team.color }}
                    >
                      {piece.team.name.charAt(0)}
                    </div>
                    <span className="font-bold text-gray-800 text-xs sm:text-sm">{piece.team.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 sm:w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
                        style={{
                          width: `${(piece.position / (BOARD_SIZE - 1)) * 100}%`,
                          backgroundColor: piece.team.color
                        }}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-gray-600 w-8 text-right">
                      {piece.position}/{BOARD_SIZE - 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 주사위 확률 안내 */}
      <div className="text-center text-[10px] sm:text-xs text-gray-400">
        🎲 주사위 확률: 1칸(70%) | 2칸(25%) | 3칸(5%)
      </div>
    </div>
  );
}
