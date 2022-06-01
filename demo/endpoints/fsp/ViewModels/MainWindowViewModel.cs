using System;
using System.Globalization;
using System.Linq.Expressions;
using System.Reactive;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;
using System.Timers;
using ReactiveUI;
using fsp.Behaviors;
using fsp.Models;
using JetBrains.Annotations;
using Newtonsoft.Json;

namespace fsp.ViewModels
{
    public class MainWindowViewModel : ViewModelBase
    {
        #region private data

        private static string NOT_SET = "not set";
        private static string WAITING = "waiting";
        private static string ACCEPTED = "accepted";
        private static string ERROR = "error";
        private string url = "http://localhost:3013";
        private string connectionId = NOT_SET;
        private string oneTimeValue = NOT_SET;
        private string tdcTroId = NOT_SET;
        private string tdcFspId = NOT_SET;
        private string txId = NOT_SET;
        private string txStatus = NOT_SET;
        private string status = string.Empty;
        private string eventData = string.Empty;
        private string amount = string.Empty;
        private string typeId = "loan";
        private string subjectId = "payment";
        private DateTime date = DateTime.Now;
        private string reportId = NOT_SET;
        private string reportStatus = NOT_SET;
        private string reportData = NOT_SET;
        private int progressBarValue = 0;
        private System.Timers.Timer progressTimer = null;
        #endregion
        
        #region ICommands
        private ReactiveCommand<Unit, Unit> OnConnectToTDC { get; }
        private ReactiveCommand<Unit, Unit> OnGenerateValue { get; }
        private ReactiveCommand<Unit, Unit> OnSendOneTimeValue { get; }
        private ReactiveCommand<Unit, Unit> OnGetReport { get; }
        private ReactiveCommand<Unit, Unit> OnCreateTransaction { get; }
        
        private ReactiveCommand<Unit, Unit> OnRefreshOneTimeValue { get; }
        private ReactiveCommand<Unit, Unit> OnRefreshTransaction { get; }
        private ReactiveCommand<Unit, Unit> OnRefreshReport { get; }
        private ReactiveCommand<Unit, Unit> OnRetrieveReport { get; }
        
        private ReactiveCommand<Unit, Unit> OnGenerateFakeConnectionId { get; }
        
        private ReactiveCommand<Unit, Unit> OnGenerateFakeTdcTroId { get; }
        
        private ReactiveCommand<Unit, Unit> OnGenerateFakeTdcFspId { get; }
        private ReactiveCommand<Unit, Unit> OnGenerateFakeReportId { get; }
        #endregion
        
        #region public observable data
        public string AppTitle => "FSP";

        public string AppDesc => "This represents an entity who issues transactions on the behalf of individuals.  Examples include a bank or NGO.";
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

        public string TxId
        {
            get => txId;
            set => this.RaiseAndSetIfChanged(ref txId, value);
        }

        public string TxStatus
        {
            get => txStatus;
            set => this.RaiseAndSetIfChanged(ref txStatus, value);
        }

        public string Amount
        {
            get => amount;
            set => this.RaiseAndSetIfChanged(ref amount, value);
        }
        public string EventData
        {
            get => eventData;
            set => this.RaiseAndSetIfChanged(ref eventData, value);
        }
        
        public string TypeId
        {
            get => typeId;
            set => this.RaiseAndSetIfChanged(ref typeId, value);
        }

        public string SubjectId
        {
            get => subjectId;
            set => this.RaiseAndSetIfChanged(ref subjectId, value);
        }

        public DateTime Date
        {
            get => date;
            set => this.RaiseAndSetIfChanged(ref date, value);
        }
        
        public string ReportId
        {
            get => reportId;
            set => this.RaiseAndSetIfChanged(ref reportId, value);
        }
        
        public string ReportStatus
        {
            get => reportStatus;
            set => reportStatus = this.RaiseAndSetIfChanged(ref reportStatus, value);
        }
        
        public string ReportData
        {
            get => reportData;
            set => reportData = this.RaiseAndSetIfChanged(ref reportData, value);
        }

        #endregion

        #region public methods
        public MainWindowViewModel() : base()
        {
            OnConnectToTDC = ReactiveCommand.Create(ConnectTDC);
            OnGenerateValue = ReactiveCommand.Create(GenerateValue);
            OnSendOneTimeValue = ReactiveCommand.Create(SendOneTimeValue);
            OnGetReport = ReactiveCommand.Create(GetReport);
            OnCreateTransaction = ReactiveCommand.Create(CreateTransaction);
            OnRefreshOneTimeValue = ReactiveCommand.Create(RefreshOneTimeValue);
            OnRefreshTransaction = ReactiveCommand.Create(RefreshTransaction);
            OnRefreshReport = ReactiveCommand.Create(RefreshReport);
            OnRetrieveReport = ReactiveCommand.Create(RetrieveReport);
            OnGenerateFakeConnectionId = ReactiveCommand.Create(GenerateFakeConnectionId);
            OnGenerateFakeTdcTroId = ReactiveCommand.Create(GenerateFakeTdcTroId);
            OnGenerateFakeTdcFspId = ReactiveCommand.Create(GenerateFakeTdcFspId);
            OnGenerateFakeReportId = ReactiveCommand.Create(GenerateFakeReportId);
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
            try
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
            catch (Exception oex)
            {
                Status = oex.Message;
                System.Diagnostics.Trace.WriteLine($"{jobName} error: {oex.Message}");
                System.Diagnostics.Trace.WriteLineIf(oex.InnerException != null,
                    $"     inner exception {oex.InnerException.Message}");
            }
            finally
            {
                StopProgressBar();
            }
        }
        #endregion
        
        #region private UI testing methods

        private void GenerateFakeConnectionId()
        {
            ExecuteLongRunningJob("GenerateFakeConnectionId", () =>
            {
                string siteUrl = $"{TDCLocalEndpoint}/v2/fsp/register/onetimekey";
                string result =
                    HttpClient.MakeGetRequest(siteUrl);

                ConnectionId = result;
            });
        }

        private void GenerateFakeTdcTroId()
        {
            ExecuteLongRunningJob("GenerateFakeTdcTroId", () =>
            {
                string siteUrl = $"{TDCLocalEndpoint}/v2/fsp/register/onetimekey";
                string result =
                    HttpClient.MakeGetRequest(siteUrl);

                TdcTroId = result;
            });
        }

        private void GenerateFakeTdcFspId()
        {
            ExecuteLongRunningJob("GenerateFakeTdcFspId", () =>
            {
                string siteUrl = $"{TDCLocalEndpoint}/v2/fsp/register/onetimekey";
                string result =
                    HttpClient.MakeGetRequest(siteUrl);

                TdcFspId = result;
            });
        }

        private void GenerateFakeReportId()
        {
            ExecuteLongRunningJob("GenerateFakeReportId", () =>
            {
                string siteUrl = $"{TDCLocalEndpoint}/v2/fsp/register/onetimekey";
                string result =
                    HttpClient.MakeGetRequest(siteUrl);

                ReportId = result;
            });
        }
        #endregion
        
        #region private methods
        private void ConnectTDC()
        {
            ExecuteLongRunningJob("ConnectTDC", () =>
            {
                string siteUrl = $"{url}/v2/transaction/register";
                TDCConnectionResult result =
                    HttpClient.MakePostRequest<TDCConnectionRequest, TDCConnectionResult>(siteUrl,
                        new TDCConnectionRequest()
                        {
                            tdcPrefix = "TDC",
                            tdcEndpoint = TDCDockerEndPoint
                        }
                    );

                ConnectionId = result.connectionData.connection_id;
                System.Diagnostics.Debug.WriteLine($"connection id created '{ConnectionId}'");
            });
        }
        
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

                    string siteUrl = $"{url}/v2/transaction/nonce";
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

        private void GetReport()
        {
            ExecuteLongRunningJob("GetReport", () =>
            {
                string siteUrl = $"{this.url}/v2/transaction/report";
                ReportId = WAITING;
                ReportStatus = WAITING;
                ReportData = NOT_SET;
                
                StartGetReportResult result =
                    HttpClient.MakePostRequest<StartGetReportRequest, StartGetReportResult>(siteUrl,
                        new StartGetReportRequest()
                        {
                            fspTdcId = tdcFspId,
                            troTdcId = tdcTroId,
                            tdcEndpoint = TDCDockerEndPoint
                        }
                    );
                
                System.Diagnostics.Debug.WriteLine($"GetReport results {result.reportId}");
                ReportId = result.reportId;
            });
        }

        private void CreateTransaction()
        {
            ExecuteLongRunningJob("CreateTransaction", () =>
            {
                string siteUrl = $"{url}/v2/transaction/create";
                TxId = WAITING;
                TxStatus = WAITING;
                string now = DateTime.Now.ToString(CultureInfo.InvariantCulture);
                TransactionData rawData = new TransactionData()
                {
                    Amount = this.Amount,
                    Date = $"{this.Date}",
                    TypeId = this.TypeId,
                    SubjectId = this.SubjectId,
                    EventData = this.EventData
                };
                string txData = rawData.ToJson();
                CreateTransactionResult result =
                    HttpClient.MakePostRequest<CreateTransactionRequest, CreateTransactionResult>(siteUrl,
                        new CreateTransactionRequest()
                        {
                            fspId = TdcFspId,
                            date = rawData.Date,
                            eventJson = txData,
                            typeId = rawData.TypeId,
                            subjectId = rawData.SubjectId,
                            amount = rawData.Amount,
                            tdcEndpoint = TDCDockerEndPoint,
                            fspHash = ComputeHash($"{now}{txData}")
                        }
                    );
                
                System.Diagnostics.Debug.WriteLine($"transaction created {result.transactionId}");
                TxId = result.transactionId;
            });
        }

        private void RefreshOneTimeValue()
        {
            ExecuteLongRunningJob("RefreshOneTimeValue", () =>
            {
                string siteUrl = $"{url}/v2/transaction/ids/{oneTimeValue}";
                IssueOneTimeKeyResponse result =
                    HttpClient.MakeGetRequest<IssueOneTimeKeyResponse>(siteUrl);
                if (null == result || 0 == string.Compare(result.state, "error", true))
                {
                    TdcFspId = "RefreshIds got no results back";
                    return;
                }


                if (!string.IsNullOrEmpty(result.tdcFspId))
                    TdcFspId = result.tdcFspId;
                if (!string.IsNullOrEmpty(result.tdcTroId))
                    TdcTroId = result.tdcTroId;
            });
        }

        private void RefreshTransaction()
        {
            ExecuteLongRunningJob("RefreshTransaction", () =>
            {
                string siteUrl = $"{url}/v2/transaction/{txId}";
                RefreshTransactionResult result =
                    HttpClient.MakeGetRequest<RefreshTransactionResult>(siteUrl);

                if (null == result || 0 == string.Compare(result.state, "error", true))
                {
                    TxStatus = "error";
                    return;
                }
                TxStatus = ACCEPTED;
            });            
        }

        private void RefreshReport()
        {
            ExecuteLongRunningJob("RefreshReport", () =>
            {
                ReportStatus = WAITING;
                ReportData = NOT_SET;
                string siteUrl = $"{url}/v2/transaction/report/{reportId}/status";
                GetReportResult<string> result =
                    HttpClient.MakeGetRequest<GetReportResult<string>>(siteUrl);
                
                ReportStatus = result.state;
            });       
        }

        private void RetrieveReport()
        {
            ExecuteLongRunningJob("RetrieveReport", () =>
            {
                try
                {
                    ReportData = NOT_SET;
                    string siteUrl = $"{url}/v2/transaction/report/{reportId}/status";
                    GetReportResult<string> result =
                        HttpClient.MakeGetRequest<GetReportResult<string>>(siteUrl);

                    if (null == result)
                    {
                        ReportStatus = ERROR;
                        ReportData =
                            "there was a non-http error trying to get report data.  check server logs for more information.";
                        return;
                    }

                    if (0 == string.Compare(result.state, "completed", true))
                    {
                        ReportStatus = ACCEPTED;
                        ReportData = result.content;
                    }
                    else
                    {
                        ReportStatus = ERROR;
                        ReportData = "the report was not found.";
                    }
                }
                catch (Exception ex)
                {
                    System.Diagnostics.Trace.WriteLine($"Retrieve report error {ex.Message}");
                    System.Diagnostics.Trace.WriteLineIf(ex.InnerException != null,
                        $"     inner exception {ex.InnerException.Message}");

                }
            });   
            
        }
        private string ComputeHash(string input)
        {
            //
            // https://docs.microsoft.com/en-us/dotnet/api/system.security.cryptography.hashalgorithm.computehash?view=netframework-4.8
            //
            using (SHA256 sha256Hash = SHA256.Create())
            {
                // Convert the input string to a byte array and compute the hash.
                byte[] data = sha256Hash.ComputeHash(Encoding.UTF8.GetBytes(input));
                var hashBuilder = new StringBuilder();

                // Loop through each byte of the hashed data 
                // and format each one as a hexadecimal string.

                for (int i = 0; i < data.Length; i++)
                {
                    hashBuilder.Append(data[i].ToString("x2"));
                }
                
                return hashBuilder.ToString().Substring(0, 32);
            }
        }
        #endregion
    }
}