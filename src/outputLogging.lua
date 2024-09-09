if SOUUUUTPUTLOADED then
	return
end

pcall(function()
	getgenv().SOUUUUTPUTLOADED = true
end)

local LogService = game:GetService("LogService")

LogService.MessageOut:Connect(function(message, messageType)
	request({
		Url = "http://localhost:10581/synzOutput",
		Method = "POST",
		Headers = {
			["Content-Type"] = "application/json",
		},
		Body = game:GetService("HttpService"):JSONEncode({
			message = message,
			messageType = messageType.Value,
		}),
	})
end)

request({
	Url = "http://localhost:10581/synzOutput",
	Method = "POST",
	Headers = {
		["Content-Type"] = "application/json",
	},
	Body = game:GetService("HttpService"):JSONEncode({
		message = string.format(
			"Receiving messages from %s (%s) as %s",
			game:GetService("MarketplaceService"):GetProductInfo(game.PlaceId).Name,
			game.PlaceId,
			game.Players.LocalPlayer.Name
		),
	}),
})
