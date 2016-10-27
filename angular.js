angular.module('myApp', ['ngMaterial']).controller('myCtrl', function($http, $scope) {
     
    // Hide the detail view when the page loads
    $scope.isDetailView = false; 

    // Store a copy of the data so that it can be converted from date to string format
    $scope.myDate = new Date();
    $scope.selectedDate = new Date($scope.myDate.getFullYear(), $scope.myDate.getMonth(), $scope.myDate.getDate());  

    // Populate drop-down for selecting favoutite team (initially Blue Jays)
    $scope.teams = ['Blue Jays','Cubs','Dodgers','Giants','Indians','Nationals','Rangers','Red Sox','Royals'];   
    $scope.favourite = 'Blue Jays';


    /* Angular functions */

    $scope.showBatters = function(team) {
       showBatters(team); 
    };

    $scope.showDetails = function(game) {
        if (game.homeTeam !== 'No games today') {
            $scope.isDetailView = true;

            $http.get('http://gd2.mlb.com' + game.directory + '/boxscore.json').then(function(response) {            
                $scope.boxscore = response.data.data.boxscore;            

                $scope.homeTeam  = $scope.boxscore.home_fname;
                $scope.homeTeamCode = $scope.boxscore.home_team_code.toUpperCase();
                $scope.homeTeamRuns = $scope.boxscore.linescore.home_team_runs;          
                $scope.homeTeamHits = $scope.boxscore.linescore.home_team_hits;
                $scope.homeTeamErrors = $scope.boxscore.linescore.home_team_errors;

                $scope.awayTeam = $scope.boxscore.away_fname;
                $scope.awayTeamCode = $scope.boxscore.away_team_code.toUpperCase();
                $scope.awayTeamRuns = $scope.boxscore.linescore.away_team_runs;          
                $scope.awayTeamHits = $scope.boxscore.linescore.away_team_hits;
                $scope.awayTeamErrors = $scope.boxscore.linescore.away_team_errors;

                $scope.scores = [];
                var scores = response.data.data.boxscore.linescore.inning_line_score;            

                for (var i=0; i<scores.length; i++) {
                    var score = {};
                    score.home = scores[i].home;
                    score.away = scores[i].away; 
                    
                    $scope.scores.push(score);               
                }

                // Initially, show the batters from the home team
                showBatters(0); 
            });
        }
    };

    $scope.showList = function() {
        $scope.isDetailView = false;
    }

    $scope.showPrevDay = function() {
        $scope.myDate.setDate($scope.myDate.getDate() - 1);
        $scope.selectedDate = new Date($scope.myDate.getFullYear(), $scope.myDate.getMonth(), $scope.myDate.getDate());        
    }

    $scope.showNextDay = function() {
        $scope.myDate.setDate($scope.myDate.getDate() + 1);
        $scope.selectedDate = new Date($scope.myDate.getFullYear(), $scope.myDate.getMonth(), $scope.myDate.getDate());        
    }

    $scope.$watch('selectedDate', function (date) {
        $scope.myDate = new Date($scope.selectedDate.getFullYear(), $scope.selectedDate.getMonth(), $scope.selectedDate.getDate());  
        showGames();
    });
   
    // Re-order the list of games when a different team becomes favourite
    $scope.$watch('favourite', function (team) {
        for (var i=$scope.games.length-1; i>=0; i--) {
            if ($scope.games[i].homeTeam === team || $scope.games[i].awayTeam === team) {
                var obj = $scope.games[i];
                $scope.games.splice(i, 1);
                $scope.games.unshift(obj);                
            }
        }
    });


    /* JavaScript functions */

    function showBatters(team) {
        $scope.batters = [];
        var batters = $scope.boxscore.batting[team].batter;          
                    
        for (var i=0; i<batters.length; i++) {
            var batter = {};
            batter.name = batters[i].name;
            batter.ab = batters[i].ab;
            batter.r = batters[i].r;
            batter.h = batters[i].h;
            batter.rbi = batters[i].rbi;
            batter.bb = batters[i].bb;
            batter.so = batters[i].so;
            batter.avg = batters[i].avg;

            $scope.batters.push(batter);
        }            
    }

    function showGames() {
        $scope.games = [];
        
        var day = $scope.selectedDate.getDate();
        var month = $scope.selectedDate.getMonth() + 1;
        var year = $scope.selectedDate.getFullYear();

        var apiFeed = 'http://gd2.mlb.com/components/game/mlb/year_' + year + '/month_'
            + (month < 10 ? '0' + month : month) + '/day_'
            + (day < 10 ? '0' + day : day) + '/master_scoreboard.json';

        $http.get(apiFeed).then(function(response) {
            var gameObject = response.data.data.games.game;           
            if (!gameObject) {
                var games = {};
                games.homeTeam = 'No games today';
                $scope.games.push(games);  
            } 
            // Check if there is more than one game that day
            else if (gameObject.constructor === Array) {
                for (var i=0; i<gameObject.length; i++) {
                    var games = {};                    
                    games.homeTeam = gameObject[i].home_team_name;
                    games.awayTeam = gameObject[i].away_team_name;    
                    games.status = gameObject[i].status.status;                         
                    games.directory = gameObject[i].game_data_directory;            
                    if (gameObject[i].linescore && gameObject[i].linescore.r) {
                        games.homeScore = gameObject[i].linescore.r.home;
                        games.awayScore = gameObject[i].linescore.r.away;

                        if (games.status === 'Final') {
                            var homeScore = parseInt(games.homeScore);
                            var awayScore = parseInt(games.awayScore);
                            var winner = 'N/A';
                            if (homeScore > awayScore) {
                               winner  = 'Home';
                            }   
                            else if (homeScore < awayScore) {
                                winner = 'Away';
                            }
                            games.winner = winner;
                        }   
                    }      
                    if ($scope.favourite === games.homeTeam || $scope.favourite === games.awayTeam) {
                        $scope.games.unshift(games);                        
                    }    
                    else {
                        $scope.games.push(games);
                    }                                         
                }
            }   
            else {
                var games = {};            
                games.homeTeam  = gameObject.home_team_name;
                games.awayTeam  = gameObject.away_team_name;
                if (gameObject.linescore && gameObject.linescore.r) {
                    games.homeScore = gameObject.linescore.r.home;
                    games.awayScore = gameObject.linescore.r.away;
                    games.status = gameObject.status.status;        
                    games.directory = gameObject.game_data_directory;
                    if (games.status === 'Final') {
                        var homeScore = parseInt(games.homeScore);
                        var awayScore = parseInt(games.awayScore);
                        var winner = 'N/A';
                        if (homeScore > awayScore) {
                            winner  = 'Home';
                        }   
                        else if (homeScore < awayScore) {
                            winner = 'Away';
                        }
                        games.winner = winner;
                    }   
                }                                 
                $scope.games.push(games);            
            }            
        });    
    }
});