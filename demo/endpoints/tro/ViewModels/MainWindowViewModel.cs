using System;
using System.Reactive;
using System.Threading.Tasks;
using System.Timers;
using ReactiveUI;
using tro.Behaviors;
using tro.Models;

namespace tro.ViewModels
{
    public class MainWindowViewModel : ViewModelBase
    {
        #region private data
        private string url = "http://localhost:3013";
        private string connectionId = "not set";
        private string oneTimeValue = "not set";
        private string tdcTroId = "not set";
        private string tdcFspId = "not set";
        private string status = string.Empty;
        private string agentId = "citizen";
        private string did = "XTv4YCzYj8jqZgL1wVMGGL";
        private string walletId = "walletId11";
        private string walletKey = "walletId11";
        private string seed = "000000000000000000000000Steward1";
        private string adminApiKey = "adminApiKey";
        private CitizenConnectionData invitation = null;
        private int progressBarValue = 0;
        private System.Timers.Timer progressTimer = null;
        #endregion
        
        #region ICommands
        private ReactiveCommand<Unit, Unit> OnConnectToTDC { get; }
        private ReactiveCommand<Unit, Unit> OnGenerateValue { get; }
        private ReactiveCommand<Unit, Unit> OnSendOneTimeValue { get; }
        private ReactiveCommand<Unit, Unit> OnRefreshOneTimeKeyIds { get; }
        private ReactiveCommand<Unit, Unit> OnStartCitizen { get; }
        private ReactiveCommand<Unit, Unit> OnStopCitizen { get; }
        #endregion
        
        #region public observable data
        public string AppTitle => "TRO";

        public string AppDesc => "Represents an individual entity or person that would accept transactions. Example transactions would be borrowing money and making payments on the loan.";
        public string Status
        {
            get => status;
            set => this.RaiseAndSetIfChanged(ref status, value);
        }

        public int ProgressBarValue
        {
            get => progressBarValue;
            set => this.RaiseAndSetIfChanged(ref progressBarValue, value);
        }

        public string TDCLocalEndpoint => "http://localhost:3015";  // TODO: this should be configurable
        public string TDCDockerEndPoint => "http://tdc-controller:3015"; // TODO: this could be configurable
        public string GuardianshipEndpoint => "http://localhost:3010"; // TODO: this should be configurable
        public string Url
        {
            get => url; 
            set => this.RaiseAndSetIfChanged(ref url, value);
        }

        public string ConnectionId
        {
            get => connectionId;
            set => this.RaiseAndSetIfChanged(ref connectionId, value);
        }
        
        public string OneTimeValue
        {
            get => oneTimeValue; 
            set => this.RaiseAndSetIfChanged(ref oneTimeValue, value);
        }

        public string TdcTroId
        {
            get => tdcTroId;
            set => this.RaiseAndSetIfChanged(ref tdcTroId, value);
        }
        
        public string TdcFspId
        {
            get => tdcFspId;
            set => this.RaiseAndSetIfChanged(ref tdcFspId, value);
        }

        public string AgentId
        {
            get => agentId;
            set => this.RaiseAndSetIfChanged(ref agentId, value);
        }
        
        public string Did
        {
            get => did;
            set => this.RaiseAndSetIfChanged(ref did, value);
        }
        
        public string WalletId
        {
            get => walletId;
            set => this.RaiseAndSetIfChanged(ref walletId, value);
        }
        
        public string WalletKey
        {
            get => walletKey;
            set => this.RaiseAndSetIfChanged(ref walletKey, value);
        }
        
        public string Seed
        {
            get => seed;
            set => this.RaiseAndSetIfChanged(ref seed, value);
        }
        
        public string AdminApiKey
        {
            get => adminApiKey;
            set => this.RaiseAndSetIfChanged(ref adminApiKey, value);
        }
        #endregion

        #region public methods
        public MainWindowViewModel() : base()
        {
            OnConnectToTDC = ReactiveCommand.Create(ConnectTDC);
            OnGenerateValue = ReactiveCommand.Create(GenerateValue);
            OnSendOneTimeValue = ReactiveCommand.Create(SendOneTimeValue);
            OnRefreshOneTimeKeyIds = ReactiveCommand.Create(RefreshOneTimeKeyIds);
            OnStartCitizen = ReactiveCommand.Create(StartCitizen);
            OnStopCitizen = ReactiveCommand.Create(StopCitizen);
        }
        
        public bool CanOnConnectTDC()
        {
            return true;    
        }
        #endregion

        #region private UI manipulation

        private void StartProgressBar()
        {
            Status = String.Empty;
            ProgressBarValue = 0;
            if (null == progressTimer)
            {
                progressTimer = new Timer();
                progressTimer.Interval = 250;
                progressTimer.Elapsed += (sender, args) =>
                {
                    ProgressBarValue += 1;
                    if (ProgressBarValue > 100)
                        ProgressBarValue = 0;
                };
            }

            progressTimer.Start();
        }

        private void StopProgressBar()
        {
            ProgressBarValue = 0;
            progressTimer.Stop();
        }

        private async void ExecuteLongRunningJob(string jobName, Action work)
        {
            await Task.Run(() =>
            {
                try
                {
                    DateTime start = DateTime.Now;
                    StartProgressBar();
                    work();

                    Status = $"{(DateTime.Now - start):ss}s";
                }
                catch (Exception ex)
                {
                    Status = ex.Message;
                    System.Diagnostics.Trace.WriteLine($"{jobName} error: {ex.Message}");
                    System.Diagnostics.Trace.WriteLineIf(ex.InnerException != null,
                        $"     inner exception {ex.InnerException.Message}");
                }
                finally
                {
                    StopProgressBar();
                }
            });
        }
        #endregion
        
        #region private methods

        private void StartCitizen()
        {
            ExecuteLongRunningJob("Start Citizen", () =>
            {
                string siteUrl = $"{GuardianshipEndpoint}/v1/manager";
                CitizenSetupResult result =
                    HttpClient.MakePostRequest<CitizenSetupRequest, CitizenSetupResult>(siteUrl,
                        new CitizenSetupRequest()
                        {
                            agentId = AgentId,
                            adminApiKey = AdminApiKey,
                            did = Did,
                            seed = Seed,
                            walletId = WalletId,
                            walletKey = WalletKey
                        }
                    );

                System.Diagnostics.Debug.WriteLine($"Start Citizen result {result}");
                invitation = result.connectionData;
            });
        }

        private void StopCitizen()
        {
            ExecuteLongRunningJob("StopCitizen", () =>
            {
                string siteUrl =  $"{GuardianshipEndpoint}/v1/manager";
                string result = HttpClient.MakeDeleteRequest<CitizenShutdownRequest>(siteUrl,
                    new CitizenShutdownRequest()
                    {
                        agentId = AgentId
                    }
                );
                
                System.Diagnostics.Debug.WriteLine($"StopCitizen result {result}");
            });
        }
        
        private void ConnectTDC()
        {
            ExecuteLongRunningJob("ConnectTDC", () =>
            {
                // TODO: replace with aries-guardianship-agency api when its fixed/available
                // it is currently broken (if we can get it fixed, the request type changes)
                string siteUrl = $"{GuardianshipEndpoint}/v2/transaction/{AgentId}/register";
                AgencyConnectionToTdcResult result = HttpClient.MakePostRequest<AgencyConnectToTdcRequest, AgencyConnectionToTdcResult>(siteUrl, 
                    new AgencyConnectToTdcRequest());

                ConnectionId = result.connectionData.connection_id;
            });
        }
        
        /// <summary>
        /// Gets a unique ID from the TDC service for use with the onetimekey functionality
        /// </summary>
        private void GenerateValue()
        {
            ExecuteLongRunningJob("GenerateValue", () =>
            {
                string siteUrl = $"{TDCLocalEndpoint}/v2/fsp/register/onetimekey";
                string result =
                    HttpClient.MakeGetRequest(siteUrl);

                OneTimeValue = result;
            });
        }

        private void SendOneTimeValue()
        {
            ExecuteLongRunningJob("SendOneTimeValue", () =>
                {
                    TdcTroId = "waiting....";
                    TdcFspId = "waiting....";
                    string siteUrl = $"{GuardianshipEndpoint}/v2/transaction/{AgentId}/registerOnetimeKey";
                    IssueOneTimeKeyResponse result =
                        HttpClient.MakePostRequest<IssueOneTimeKeyRequest, IssueOneTimeKeyResponse>(siteUrl,
                            new IssueOneTimeKeyRequest()
                            {
                                connectionId = connectionId,
                                oneTimeKey = oneTimeValue,
                                tdcEndpoint = TDCDockerEndPoint
                            }
                        );

                    if (!string.IsNullOrEmpty(result.tdcFspId))
                        TdcFspId = result.tdcFspId;
                    if (!string.IsNullOrEmpty(result.tdcTroId))
                        TdcTroId = result.tdcTroId;
                });
        }

        private void RefreshOneTimeKeyIds()
        {
            ExecuteLongRunningJob("GenerateValue", () =>
            {
                string siteUrl = $"{GuardianshipEndpoint}/v2/transaction/{AgentId}/ids/";
                IssueOneTimeKeyResponse result =
                    HttpClient.MakePostRequest<IssueOneTimeKeyRequest, IssueOneTimeKeyResponse>(siteUrl,
                        new IssueOneTimeKeyRequest()
                        {
                            connectionId = connectionId,
                            oneTimeKey = oneTimeValue,
                            tdcEndpoint = TDCDockerEndPoint
                        }
                    );

                System.Diagnostics.Debug.WriteLine($"RefreshIds got back {result}");
                if (!string.IsNullOrEmpty(result.id))
                    TdcTroId = result.id;
            });
        }
        #endregion
    }
}