using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;

const int GwlExStyle = -20;
const long WsExTopMost = 0x00000008L;
const uint SwpNoSize = 0x0001;
const uint SwpNoMove = 0x0002;
const uint SwpNoActivate = 0x0010;
const uint SwpShowWindow = 0x0040;

IntPtr parentWindow = ParseParentWindow(args);

try
{
    using Stream input = Console.OpenStandardInput();
    using Stream output = Console.OpenStandardOutput();
    JsonDocument request = ReadMessage(input);
    string? messageType = request.RootElement.GetProperty("type").GetString();

    if (parentWindow == IntPtr.Zero || !IsWindow(parentWindow))
    {
        WriteMessage(output, new { ok = false, message = "未获取到当前插件窗口句柄。" });
        return;
    }

    if (messageType == "window:set-always-on-top")
    {
        bool enabled = request.RootElement.GetProperty("enabled").GetBoolean();
        IntPtr insertAfter = enabled ? new IntPtr(-1) : new IntPtr(-2);
        bool updated = SetWindowPos(
            parentWindow,
            insertAfter,
            0,
            0,
            0,
            0,
            SwpNoMove | SwpNoSize | SwpNoActivate | SwpShowWindow
        );

        if (!updated)
        {
            WriteMessage(output, new
            {
                ok = false,
                message = $"Windows 置顶调用失败：{Marshal.GetLastWin32Error()}"
            });
            return;
        }
    }
    else if (messageType != "window:get-always-on-top")
    {
        WriteMessage(output, new { ok = false, message = "不支持的窗口操作。" });
        return;
    }

    bool isTopMost = (GetWindowLongPtr(parentWindow, GwlExStyle).ToInt64() & WsExTopMost) != 0;
    WriteMessage(output, new { ok = true, enabled = isTopMost });
}
catch (Exception error)
{
    using Stream output = Console.OpenStandardOutput();
    WriteMessage(output, new { ok = false, message = error.Message });
}

static IntPtr ParseParentWindow(string[] arguments)
{
    const string prefix = "--parent-window=";
    string? value = arguments.FirstOrDefault(argument => argument.StartsWith(prefix, StringComparison.Ordinal));
    return value is not null && long.TryParse(value[prefix.Length..], out long handle)
        ? new IntPtr(handle)
        : IntPtr.Zero;
}

static JsonDocument ReadMessage(Stream input)
{
    Span<byte> lengthBuffer = stackalloc byte[sizeof(int)];
    ReadFully(input, lengthBuffer);
    int messageLength = BitConverter.ToInt32(lengthBuffer);
    if (messageLength <= 0 || messageLength > 1024 * 1024)
    {
        throw new InvalidDataException("Native Messaging 消息长度无效。");
    }

    byte[] payload = new byte[messageLength];
    ReadFully(input, payload);
    return JsonDocument.Parse(payload);
}

static void ReadFully(Stream input, Span<byte> buffer)
{
    int bytesRead = 0;
    while (bytesRead < buffer.Length)
    {
        int read = input.Read(buffer[bytesRead..]);
        if (read == 0)
        {
            throw new EndOfStreamException("Native Messaging 消息不完整。");
        }
        bytesRead += read;
    }
}

static void WriteMessage(Stream output, object response)
{
    byte[] payload = Encoding.UTF8.GetBytes(JsonSerializer.Serialize(response));
    byte[] length = BitConverter.GetBytes(payload.Length);
    output.Write(length);
    output.Write(payload);
    output.Flush();
}

[DllImport("user32.dll", SetLastError = true)]
static extern bool SetWindowPos(
    IntPtr hWnd,
    IntPtr hWndInsertAfter,
    int x,
    int y,
    int width,
    int height,
    uint flags
);

[DllImport("user32.dll", SetLastError = true)]
static extern bool IsWindow(IntPtr hWnd);

[DllImport("user32.dll", EntryPoint = "GetWindowLongPtrW", SetLastError = true)]
static extern IntPtr GetWindowLongPtr(IntPtr hWnd, int index);
